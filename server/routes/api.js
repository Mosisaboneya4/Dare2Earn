const express = require('express');
const { query, transaction } = require('../database');
const { authenticateToken } = require('../auth');
const router = express.Router();

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get all dares with pagination
router.get('/dares', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, category_id } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    const params = [limit, offset];
    let paramIndex = 3;
    
    if (status) {
      whereClause += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }
    
    if (category_id) {
      whereClause += ` AND d.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }
    
    const daresQuery = `
      SELECT 
        d.*,
        u.username as creator_username,
        u.full_name as creator_full_name,
        c.name as category_name,
        COALESCE(participant_count.count, 0) as participant_count
      FROM dares d
      LEFT JOIN users u ON d.created_by_user_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN (
        SELECT dare_id, COUNT(*) as count 
        FROM dare_participants 
        GROUP BY dare_id
      ) participant_count ON d.id = participant_count.dare_id
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await query(daresQuery, params);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM dares d
      WHERE ${whereClause}
    `;
    const countResult = await query(countQuery, params.slice(2));
    
    res.json({
      dares: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get dares error:', error);
    res.status(500).json({ error: 'Failed to fetch dares' });
  }
});

// Get dare by ID with participants
router.get('/dares/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get dare details
    const dareResult = await query(`
      SELECT 
        d.*,
        u.username as creator_username,
        u.full_name as creator_full_name,
        c.name as category_name
      FROM dares d
      LEFT JOIN users u ON d.created_by_user_id = u.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE d.id = $1
    `, [id]);
    
    if (dareResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dare not found' });
    }
    
    // Get participants
    const participantsResult = await query(`
      SELECT 
        dp.*,
        u.username,
        u.full_name,
        u.profile_pic_url
      FROM dare_participants dp
      JOIN users u ON dp.user_id = u.id
      WHERE dp.dare_id = $1
      ORDER BY dp.votes_count DESC, dp.created_at ASC
    `, [id]);
    
    res.json({
      dare: dareResult.rows[0],
      participants: participantsResult.rows
    });
  } catch (error) {
    console.error('Get dare error:', error);
    res.status(500).json({ error: 'Failed to fetch dare' });
  }
});

// Create new dare (authenticated)
router.post('/dares', authenticateToken, async (req, res) => {
  try {
    const {
      title,
      description,
      entry_fee,
      category_id,
      start_time,
      end_time
    } = req.body;
    
    // Validation
    if (!title || !description || !entry_fee || !start_time || !end_time) {
      return res.status(400).json({ 
        error: 'Title, description, entry fee, start time, and end time are required' 
      });
    }
    
    if (new Date(start_time) >= new Date(end_time)) {
      return res.status(400).json({ 
        error: 'End time must be after start time' 
      });
    }
    
    if (parseFloat(entry_fee) < 0) {
      return res.status(400).json({ 
        error: 'Entry fee must be non-negative' 
      });
    }
    
    const result = await query(`
      INSERT INTO dares (
        title, description, created_by_user_id, entry_fee, 
        category_id, start_time, end_time
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [title, description, req.user.id, entry_fee, category_id, start_time, end_time]);
    
    res.status(201).json({
      success: true,
      message: 'Dare created successfully',
      dare: result.rows[0]
    });
  } catch (error) {
    console.error('Create dare error:', error);
    res.status(500).json({ error: 'Failed to create dare' });
  }
});

// Join a dare (authenticated)
router.post('/dares/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await transaction(async (client) => {
      // Check if dare exists and is open
      const dareResult = await client.query(
        'SELECT * FROM dares WHERE id = $1',
        [id]
      );
      
      if (dareResult.rows.length === 0) {
        throw new Error('Dare not found');
      }
      
      const dare = dareResult.rows[0];
      
      if (dare.status !== 'open') {
        throw new Error('This dare is no longer accepting participants');
      }
      
      if (new Date() > new Date(dare.end_time)) {
        throw new Error('This dare has already ended');
      }
      
      // Check if user already joined
      const existingParticipant = await client.query(
        'SELECT id FROM dare_participants WHERE dare_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      
      if (existingParticipant.rows.length > 0) {
        throw new Error('You have already joined this dare');
      }
      
      // Add participant
      const participantResult = await client.query(`
        INSERT INTO dare_participants (dare_id, user_id)
        VALUES ($1, $2)
        RETURNING *
      `, [id, req.user.id]);
      
      // Update prize pool
      await client.query(
        'UPDATE dares SET prize_pool = prize_pool + $1 WHERE id = $2',
        [dare.entry_fee, id]
      );
      
      return participantResult.rows[0];
    });
    
    res.json({
      success: true,
      message: 'Successfully joined the dare'
    });
  } catch (error) {
    console.error('Join dare error:', error);
    res.status(400).json({ error: error.message || 'Failed to join dare' });
  }
});

// Submit to a dare (authenticated)
router.post('/dares/:id/submit', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { submission_url, submission_caption } = req.body;
    
    if (!submission_url) {
      return res.status(400).json({ error: 'Submission URL is required' });
    }
    
    // Check if user is a participant
    const participantResult = await query(
      'SELECT * FROM dare_participants WHERE dare_id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    
    if (participantResult.rows.length === 0) {
      return res.status(403).json({ error: 'You must join the dare before submitting' });
    }
    
    // Update submission
    await query(`
      UPDATE dare_participants 
      SET submission_url = $1, submission_caption = $2, updated_at = NOW()
      WHERE dare_id = $3 AND user_id = $4
    `, [submission_url, submission_caption || '', id, req.user.id]);
    
    res.json({
      success: true,
      message: 'Submission uploaded successfully'
    });
  } catch (error) {
    console.error('Submit to dare error:', error);
    res.status(500).json({ error: 'Failed to submit to dare' });
  }
});

// Vote on a submission (authenticated)
router.post('/participants/:id/vote', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_boosted_vote = false } = req.body;
    
    await transaction(async (client) => {
      // Check if participant exists
      const participantResult = await client.query(
        'SELECT * FROM dare_participants WHERE id = $1',
        [id]
      );
      
      if (participantResult.rows.length === 0) {
        throw new Error('Participant not found');
      }
      
      const participant = participantResult.rows[0];
      
      // Check if user is trying to vote for themselves
      if (participant.user_id === req.user.id) {
        throw new Error('You cannot vote for yourself');
      }
      
      // Check if user already voted
      const existingVote = await client.query(
        'SELECT id FROM votes WHERE dare_participant_id = $1 AND voter_user_id = $2',
        [id, req.user.id]
      );
      
      if (existingVote.rows.length > 0) {
        throw new Error('You have already voted for this submission');
      }
      
      // Add vote
      await client.query(`
        INSERT INTO votes (dare_participant_id, voter_user_id, is_boosted_vote)
        VALUES ($1, $2, $3)
      `, [id, req.user.id, is_boosted_vote]);
    });
    
    res.json({
      success: true,
      message: 'Vote recorded successfully'
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(400).json({ error: error.message || 'Failed to record vote' });
  }
});

// Get user's dares
router.get('/users/my-dares', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        d.*,
        c.name as category_name,
        COALESCE(participant_count.count, 0) as participant_count
      FROM dares d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN (
        SELECT dare_id, COUNT(*) as count 
        FROM dare_participants 
        GROUP BY dare_id
      ) participant_count ON d.id = participant_count.dare_id
      WHERE d.created_by_user_id = $1
      ORDER BY d.created_at DESC
    `, [req.user.id]);
    
    res.json({ dares: result.rows });
  } catch (error) {
    console.error('Get user dares error:', error);
    res.status(500).json({ error: 'Failed to fetch your dares' });
  }
});

// Get user's participations
router.get('/users/my-participations', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        dp.*,
        d.title as dare_title,
        d.description as dare_description,
        d.status as dare_status,
        d.end_time,
        c.name as category_name
      FROM dare_participants dp
      JOIN dares d ON dp.dare_id = d.id
      LEFT JOIN categories c ON d.category_id = c.id
      WHERE dp.user_id = $1
      ORDER BY dp.created_at DESC
    `, [req.user.id]);
    
    res.json({ participations: result.rows });
  } catch (error) {
    console.error('Get user participations error:', error);
    res.status(500).json({ error: 'Failed to fetch your participations' });
  }
});

// Get user's transactions
router.get('/users/my-transactions', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT *
      FROM transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);
    
    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch your transactions' });
  }
});

// Get user's notifications
router.get('/users/my-notifications', authenticateToken, async (req, res) => {
  try {
    const result = await query(`
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);
    
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch your notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

module.exports = router;

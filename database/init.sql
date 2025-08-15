-- Add the required_media_type column to dares table
ALTER TABLE dares 
ADD COLUMN IF NOT EXISTS required_media_type TEXT NOT NULL DEFAULT 'image'
CHECK (required_media_type IN ('image', 'video'));

-- Update existing dares to have a default media type
UPDATE dares SET required_media_type = 'image' WHERE required_media_type IS NULL;

-- Create a unique constraint on dares(id, required_media_type)
ALTER TABLE dares
ADD CONSTRAINT uq_dare_media_type UNIQUE (id, required_media_type);

-- Drop the existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_dare_media_type'
    ) THEN
        EXECUTE 'ALTER TABLE dare_participants DROP CONSTRAINT fk_dare_media_type';
    END IF;
END $$;

-- Now add the foreign key constraint to dare_participants
ALTER TABLE dare_participants
ADD CONSTRAINT fk_dare_media_type
FOREIGN KEY (dare_id, media_type) 
REFERENCES dares(id, required_media_type) 
DEFERRABLE INITIALLY DEFERRED;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_dare_participants_dare_media 
ON dare_participants(dare_id, media_type);
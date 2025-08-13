-- Database initialization for Dare2Earn (converted from Supabase)
-- Run this script on your local PostgreSQL database

-- Create database (run this separately as superuser if needed)
-- CREATE DATABASE dare2earn;

-- Connect to dare2earn database before running the rest

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (adapted for local auth instead of Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    profile_pic_url TEXT,
    bio TEXT,
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for authentication management
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES 
    ('funny', 'Funny and humorous dares'),
    ('crazy', 'Extreme and wild challenges'),
    ('talent', 'Show off your skills'),
    ('food', 'Food-related challenges'),
    ('dance', 'Dance and movement dares')
ON CONFLICT (name) DO NOTHING;

-- Dares table
CREATE TABLE IF NOT EXISTS public.dares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    entry_fee DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed', 'cancelled')),
    prize_pool DECIMAL(10, 2) DEFAULT 0.00,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    winner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dare participants table
CREATE TABLE IF NOT EXISTS public.dare_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dare_id UUID NOT NULL REFERENCES public.dares(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
    submission_url TEXT,
    submission_caption TEXT,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dare_id, user_id)
);

-- Votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dare_participant_id UUID NOT NULL REFERENCES public.dare_participants(id) ON DELETE CASCADE,
    voter_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    is_boosted_vote BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dare_participant_id, voter_user_id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('entry_fee', 'winnings', 'boost_payment', 'withdrawal')),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('telebirr', 'chapa', 'internal_wallet')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    reference_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_dare', 'vote_received', 'won_dare', 'payment_success', 'dare_reminder')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads table (replacing Supabase storage)
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    bucket TEXT NOT NULL, -- 'profile-pictures' or 'dare-submissions'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_dares_status ON public.dares(status);
CREATE INDEX IF NOT EXISTS idx_dares_created_by ON public.dares(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_dare_participants_dare_id ON public.dare_participants(dare_id);
CREATE INDEX IF NOT EXISTS idx_dare_participants_user_id ON public.dare_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_dare_participant_id ON public.votes(dare_participant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON public.file_uploads(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_modtime
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_dares_modtime
BEFORE UPDATE ON public.dares
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_dare_participants_modtime
BEFORE UPDATE ON public.dare_participants
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Function to automatically update vote counts
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.dare_participants 
        SET votes_count = votes_count + 1 
        WHERE id = NEW.dare_participant_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.dare_participants 
        SET votes_count = votes_count - 1 
        WHERE id = OLD.dare_participant_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update vote counts automatically
CREATE TRIGGER vote_count_trigger
AFTER INSERT OR DELETE ON public.votes
FOR EACH ROW EXECUTE FUNCTION update_vote_count();

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a user management function (replacing Supabase RPC)
CREATE OR REPLACE FUNCTION create_user_account(
    p_email TEXT,
    p_password_hash TEXT,
    p_username TEXT,
    p_full_name TEXT DEFAULT NULL,
    p_phone_number TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Insert the new user
    INSERT INTO public.users (email, password_hash, username, full_name, phone_number)
    VALUES (p_email, p_password_hash, p_username, p_full_name, p_phone_number)
    RETURNING id INTO new_user_id;
    
    -- Return success result
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'User created successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle duplicate key errors
        IF SQLERRM LIKE '%users_email_key%' THEN
            result := json_build_object(
                'success', false,
                'message', 'Email already exists'
            );
        ELSIF SQLERRM LIKE '%users_username_key%' THEN
            result := json_build_object(
                'success', false,
                'message', 'Username already exists'
            );
        ELSIF SQLERRM LIKE '%users_phone_number_key%' THEN
            result := json_build_object(
                'success', false,
                'message', 'Phone number already exists'
            );
        ELSE
            result := json_build_object(
                'success', false,
                'message', 'Duplicate entry error'
            );
        END IF;
        RETURN result;
    WHEN OTHERS THEN
        result := json_build_object(
            'success', false,
            'message', 'Database error: ' || SQLERRM
        );
        RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT,
    profile_pic_url TEXT,
    bio TEXT,
    wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Indexes for better performance
CREATE INDEX idx_dares_status ON public.dares(status);
CREATE INDEX idx_dare_participants_dare_id ON public.dare_participants(dare_id);
CREATE INDEX idx_dare_participants_user_id ON public.dare_participants(user_id);
CREATE INDEX idx_votes_dare_participant_id ON public.votes(dare_participant_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

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

-- Row Level Security (RLS) policies would be added here in a separate migration
-- after setting up authentication

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dare_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create a function to check if a user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if a user is the owner of a record
CREATE OR REPLACE FUNCTION public.is_owner(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Categories policies (read-only for all)
CREATE POLICY "Categories are viewable by everyone"
    ON public.categories
    FOR SELECT
    USING (true);

-- Dares policies
CREATE POLICY "Dares are viewable by everyone"
    ON public.dares
    FOR SELECT
    USING (true);

CREATE POLICY "Users can create dares"
    ON public.dares
    FOR INSERT
    WITH CHECK (is_authenticated());

CREATE POLICY "Users can update their own dares"
    ON public.dares
    FOR UPDATE
    USING (created_by_user_id = auth.uid() AND status = 'open');

-- Dare participants policies
CREATE POLICY "Dare participants are viewable by everyone"
    ON public.dare_participants
    FOR SELECT
    USING (true);

CREATE POLICY "Users can join dares"
    ON public.dare_participants
    FOR INSERT
    WITH CHECK (is_authenticated());

CREATE POLICY "Users can update their own submissions"
    ON public.dare_participants
    FOR UPDATE
    USING (user_id = auth.uid());

-- Votes policies
CREATE POLICY "Votes are viewable by everyone"
    ON public.votes
    FOR SELECT
    USING (true);

CREATE POLICY "Users can vote on submissions"
    ON public.votes
    FOR INSERT
    WITH CHECK (is_authenticated() AND voter_user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
    ON public.transactions
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create transactions"
    ON public.transactions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can mark notifications as read"
    ON public.notifications
    FOR UPDATE
    USING (user_id = auth.uid());

-- Service role access (for server-side operations)
CREATE POLICY "Enable full access to service role on users"
    ON public.users
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access to service role on categories"
    ON public.categories
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access to service role on dares"
    ON public.dares
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access to service role on dare_participants"
    ON public.dare_participants
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access to service role on votes"
    ON public.votes
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access to service role on transactions"
    ON public.transactions
    TO service_role
    USING (true) WITH CHECK (true);

CREATE POLICY "Enable full access to service role on notifications"
    ON public.notifications
    TO service_role
    USING (true) WITH CHECK (true);

-- Set up storage for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage for dare submissions
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dare-submissions', 'dare-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile pictures
CREATE POLICY "Profile pictures are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own profile picture"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'profile-pictures' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Set up storage policies for dare submissions
CREATE POLICY "Dare submissions are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'dare-submissions');

CREATE POLICY "Users can upload their own submissions"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'dare-submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

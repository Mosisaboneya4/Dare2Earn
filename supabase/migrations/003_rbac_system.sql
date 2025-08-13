-- Create user roles enum type
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN role public.user_role NOT NULL DEFAULT 'user';

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set admin (to be called by a database admin)
CREATE OR REPLACE FUNCTION public.set_user_role(user_email TEXT, new_role public.user_role)
RETURNS void AS $$
BEGIN
    UPDATE public.users 
    SET role = new_role
    FROM auth.users 
    WHERE auth.users.email = user_email 
    AND public.users.id = auth.users.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing policies to include admin access
-- Users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id OR is_admin());

-- Dares table
DROP POLICY IF EXISTS "Users can update their own dares" ON public.dares;
CREATE POLICY "Users can update their own dares"
    ON public.dares
    FOR UPDATE
    USING (created_by_user_id = auth.uid() AND status = 'open' OR is_admin());

-- Admin can do anything on all tables
DO $$
DECLARE
    t record;
    policy_name text;
    policy_exists boolean;
BEGIN
    FOR t IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name IN ('users', 'dares', 'dare_participants', 'votes', 'transactions', 'notifications', 'categories')
    LOOP
        policy_name := 'Admin can manage ' || t.table_name;
        
        -- Check if policy already exists
        SELECT EXISTS (
            SELECT 1 
            FROM pg_policies 
            WHERE schemaname = t.table_schema 
            AND tablename = t.table_name 
            AND policyname = policy_name
        ) INTO policy_exists;
        
        IF NOT policy_exists THEN
            EXECUTE format('CREATE POLICY "%s" ON %I.%I TO authenticated USING (is_admin()) WITH CHECK (is_admin())', 
                          policy_name, t.table_schema, t.table_name);
        END IF;
    END LOOP;
END;
$$;

-- Create a trigger to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, phone_number, username, full_name)
    VALUES (
        NEW.id,
        NEW.phone,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create a function to get the current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

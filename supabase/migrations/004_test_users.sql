-- Create test admin user (password: admin123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    phone,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'admin@dare2earn.test',
    '$2a$10$rL6yN3i6VJjZ7VtWQeH9UOQYf6XZz8JqXK7vBzLd1nR2pV9sXmNOPq', -- bcrypt hash of 'admin123'
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"admin","full_name":"Test Admin"}',
    NOW(),
    NOW(),
    '+251911111111',
    '',
    '',
    '',
    ''
);

-- Create test regular user (password: user123)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    phone,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'user@dare2earn.test',
    '$2a$10$rL6yN3i6VJjZ7VtWQeH9UOQYf6XZz8JqXK7vBzLd1nR2pV9sXmNOPq', -- bcrypt hash of 'user123'
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"testuser","full_name":"Test User"}',
    NOW(),
    NOW(),
    '+251922222222',
    '',
    '',
    '',
    ''
);

-- Set admin role for the admin user
UPDATE public.users SET role = 'admin' 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Set user role for the regular user
UPDATE public.users SET role = 'user' 
WHERE id = '22222222-2222-2222-2222-222222222222';

-- Create a function to easily create test users (for development only)
CREATE OR REPLACE FUNCTION public.create_test_user(
    email TEXT,
    password TEXT,
    username TEXT,
    full_name TEXT,
    phone TEXT,
    is_admin BOOLEAN DEFAULT false
) 
RETURNS UUID AS $$
DECLARE
    user_id UUID;
    encrypted_pw TEXT;
BEGIN
    -- Generate a bcrypt hash of the password
    encrypted_pw := crypt(password, gen_salt('bf'));
    
    -- Insert into auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, recovery_sent_at, last_sign_in_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, phone
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        email,
        encrypted_pw,
        NOW(), NOW(), NOW(),
        jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
        jsonb_build_object('username', username, 'full_name', full_name),
        NOW(), NOW(),
        phone
    ) RETURNING id INTO user_id;
    
    -- Set role in public.users
    INSERT INTO public.users (id, phone_number, username, full_name, role)
    VALUES (user_id, phone, username, full_name, 
           CASE WHEN is_admin THEN 'admin'::public.user_role ELSE 'user'::public.user_role END);
    
    RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

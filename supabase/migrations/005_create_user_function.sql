-- Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.create_new_user(uuid, text, jsonb);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.create_new_user(
  p_user_id uuid,
  p_user_email text,
  p_user_metadata jsonb
) 
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_username text;
  v_full_name text;
  v_phone_number text;
  v_error_context text;
  v_error_message text;
BEGIN
  -- Log the start of the function
  RAISE LOG 'Starting create_new_user for email: %', p_user_email;
  
  -- Extract metadata with validation
  v_username := p_user_metadata->>'username';
  v_full_name := p_user_metadata->>'full_name';
  v_phone_number := p_user_metadata->>'phone_number';
  
  -- Validate input
  IF v_username IS NULL OR v_username = '' THEN
    RAISE EXCEPTION 'Username is required';
  END IF;
  
  -- Generate a default phone number if not provided (using a UUID to ensure uniqueness)
  IF v_phone_number IS NULL OR v_phone_number = '' THEN
    v_phone_number := 'user-' || replace(gen_random_uuid()::text, '-', '') || '@dare2earn.app';
  END IF;
  
  -- Log the extracted values
  RAISE LOG 'Extracted values - Username: %, Full Name: %', v_username, v_full_name;
  
  -- Check if username already exists
  IF EXISTS (SELECT 1 FROM public.users WHERE username = v_username) THEN
    RAISE EXCEPTION 'Username % already exists', v_username;
  END IF;
  
  -- Check if user already exists by email
  IF EXISTS (SELECT 1 FROM public.users WHERE email = p_user_email) THEN
    RAISE EXCEPTION 'User with email % already exists', p_user_email;
  END IF;
  
  -- Log before insert
  RAISE LOG 'Attempting to insert new user with ID: %', p_user_id;
  
  -- Insert the new user
  INSERT INTO public.users (
    id,
    email,
    username,
    full_name,
    phone_number,
    wallet_balance,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_user_email,
    v_username,
    COALESCE(v_full_name, split_part(p_user_email, '@', 1)),
    v_phone_number, -- Using the generated or provided phone number
    0.00, -- wallet_balance
    NOW(),
    NOW()
  );
  
  -- Log successful insertion
  RAISE LOG 'Successfully created user % with ID %', p_user_email, p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User created successfully',
    'user_id', p_user_id
  );
  
EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS 
    v_error_context = PG_EXCEPTION_CONTEXT,
    v_error_message = MESSAGE_TEXT;
  
  -- Log detailed error information
  RAISE LOG 'User creation failed with error: %', SQLERRM;
  RAISE LOG 'SQLSTATE: %', SQLSTATE;
  RAISE LOG 'Error context: %', v_error_context;
  
  -- Log the exact query that caused the error if possible
  RAISE LOG 'Failed to insert user with: ID=%, Email=%, Username=%', 
    p_user_id, p_user_email, v_username;
  
  -- Return detailed error information
  RETURN jsonb_build_object(
    'success', false,
    'message', v_error_message,
    'sqlstate', SQLSTATE,
    'context', v_error_context,
    'user_id', p_user_id,
    'email', p_user_email,
    'username', v_username,
    'error_details', jsonb_build_object(
      'routine', PG_EXCEPTION_ROUTINE,
      'schema', PG_EXCEPTION_SCHEMA,
      'table', PG_EXCEPTION_TABLE,
      'column', PG_EXCEPTION_COLUMN,
      'constraint', PG_EXCEPTION_CONSTRAINT,
      'detail', PG_EXCEPTION_DETAIL,
      'hint', PG_EXCEPTION_HINT
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_new_user(uuid, text, jsonb) TO authenticated;

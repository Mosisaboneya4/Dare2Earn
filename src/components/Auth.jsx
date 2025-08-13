import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRightIcon, EyeIcon, EyeSlashIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function Auth({ isSignUp = false }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState(isSignUp ? 'signup' : 'login');
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (authMode === 'signup' || authMode === 'login') {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (authMode === 'signup' && formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (authMode === 'login') {
        console.log('Attempting to sign in with:', formData.email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });
        
        if (error) {
          console.error('Login error:', error);
          throw error;
        }
        
        console.log('Login successful, user data:', data);
        
        // Dispatch custom event to notify App.js of login
        window.dispatchEvent(new CustomEvent('authStateChange', {
          detail: { action: 'login', user: data.user }
        }));
        
        toast.success(`Welcome back, ${data.user.role === 'admin' ? 'Admin' : 'User'}!`);
        navigate('/dashboard');
      } else if (authMode === 'signup') {
        console.log('Starting signup process for:', formData.email);
        
        // Create auth user using our simplified API
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              full_name: formData.email.split('@')[0],
              username: formData.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
            }
          },
        });
        
        if (signUpError) {
          console.error('Auth signup error:', signUpError);
          throw signUpError;
        }
        
        console.log('Signup successful, user data:', authData);
        
        // Dispatch custom event to notify App.js of signup
        window.dispatchEvent(new CustomEvent('authStateChange', {
          detail: { action: 'login', user: authData.user }
        }));
        
        toast.success('Account created successfully!');
        navigate('/dashboard');
      } else if (authMode === 'magiclink') {
        const { error } = await supabase.auth.signInWithOtp({
          email: formData.email,
          options: {
            emailRedirectTo: window.location.origin + '/dashboard',
          },
        });
        
        if (error) throw error;
        toast.success('Check your email for the login link!');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleAuth = async () => {
    try {
      console.log('Initiating Google OAuth...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/dashboard',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        throw error;
      }
      console.log('Google OAuth initiated:', data);
    } catch (error) {
      console.error('Authentication error:', error);
      toast.error(error.message || 'Failed to authenticate with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-blue-50 to-white">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 mb-4">
              <span className="text-white font-bold text-2xl">D2E</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {authMode === 'login' ? 'Welcome Back!' : 'Join Dare2Earn'}
            </h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              {authMode === 'login' 
                ? 'Sign in to your account and continue your journey' 
                : 'Create your account and start earning with challenges'}
            </p>
          </div>
        </div>

        {/* Tab Section */}
        <div className="px-8 py-4 bg-gray-50 border-b">
          <div className="flex rounded-lg bg-white p-1 shadow-sm">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${
                authMode === 'login' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all duration-200 ${
                authMode === 'signup'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Auth Form */}
        <div className="px-8 py-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email address
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full px-4 py-3 text-sm rounded-lg border-2 ${
                    errors.email 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 bg-gray-50 focus:bg-white`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <p className="text-sm text-red-500 mt-1 flex items-center">
                <span className="mr-1">⚠️</span>{errors.email}
              </p>}
            </div>

            {(authMode === 'login' || authMode === 'signup') && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                      Password
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        onClick={() => setAuthMode('magiclink')}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'}
                      className={`block w-full px-4 py-3 text-sm rounded-lg border-2 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 bg-gray-50 focus:bg-white pr-12`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-red-500 mt-1 flex items-center">
                    <span className="mr-1">⚠️</span>{errors.password}
                  </p>}
                </div>

                {authMode === 'signup' && (
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      className={`block w-full px-4 py-3 text-sm rounded-lg border-2 ${
                        errors.confirmPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 bg-gray-50 focus:bg-white`}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1 flex items-center">
                        <span className="mr-1">⚠️</span>{errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : authMode === 'login' ? (
                  <>
                    Sign In to Your Account
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                ) : authMode === 'signup' ? (
                  <>
                    Create Your Account
                    <ArrowRightIcon className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>
                    Send Magic Link
                    <EnvelopeIcon className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white text-xs text-gray-400 font-medium uppercase tracking-wide">Or continue with</span>
            </div>
          </div>

          {/* Social Auth Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.01]"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>

            {authMode === 'login' && (
              <button
                type="button"
                onClick={() => setAuthMode('magiclink')}
                className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-200 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.01]"
              >
                <EnvelopeIcon className="w-5 h-5 mr-3 text-gray-500" />
                Continue with Magic Link
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-gray-50 border-t">
          <div className="text-center text-sm text-gray-600">
            {authMode === 'login' ? (
              <>
                New to Dare2Earn?{' '}
                <button
                  onClick={() => setAuthMode('signup')}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => setAuthMode('login')}
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

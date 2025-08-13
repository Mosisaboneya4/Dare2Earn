import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import LandingPage from './components/LandingPage';
import UserDashboard from './components/user/UserDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import Auth from './components/Auth';
import { Toaster } from 'react-hot-toast';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        // First check if we have user data in localStorage
        const storedUserData = localStorage.getItem('user_data');
        const token = localStorage.getItem('auth_token');
        
        if (token && storedUserData) {
          try {
            const userData = JSON.parse(storedUserData);
            console.log('Using stored user data:', userData);
            setUser(userData);
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError);
          }
        }
        
        // If no stored data, try to get from API
        const { data, error } = await supabase.auth.getUser();
        if (!error && data?.user) {
          console.log('Fetched user data from API:', data.user);
          console.log('User role:', data.user.role);
          setUser(data.user);
        } else {
          console.log('No user data from API:', { data, error });
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Listen for storage changes (logout from other components)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' && !e.newValue) {
        console.log('Auth token removed, logging out user');
        setUser(null);
      } else if (e.key === 'user_data' && e.newValue) {
        try {
          const userData = JSON.parse(e.newValue);
          console.log('User data updated:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Failed to parse updated user data:', error);
        }
      }
    };

    // Add storage event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab changes
    const handleAuthChange = (e) => {
      console.log('Auth state changed:', e.detail);
      if (e.detail.action === 'logout') {
        setUser(null);
      } else if (e.detail.action === 'login' && e.detail.user) {
        setUser(e.detail.user);
      }
    };
    
    window.addEventListener('authStateChange', handleAuthChange);

    checkAuth();

    // Cleanup listeners
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authStateChange', handleAuthChange);
    };
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-900">
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route 
            path="/login" 
            element={!user ? <Auth /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/signup" 
            element={!user ? <Auth isSignUp /> : <Navigate to="/dashboard" />} 
          />
          <Route 
            path="/dashboard" 
            element={
              user ? (
                (() => {
                  console.log('Dashboard routing - User object:', user);
                  console.log('Dashboard routing - User role:', user.role);
                  console.log('Dashboard routing - Is admin?', user.role === 'admin');
                  return user.role === 'admin' ? (
                    <AdminDashboard user={user} />
                  ) : (
                    <UserDashboard user={user} />
                  );
                })()
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

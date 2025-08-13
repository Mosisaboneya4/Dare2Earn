import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { 
  LogoutIcon, 
  UserCircleIcon, 
  PlusIcon,
  FireIcon,
  TrophyIcon
} from '@heroicons/react/outline';

export default function Dashboard({ user }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProfile();
  }, [user]);

  const getProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserData(data);
      setUsername(data.username || '');
    } catch (error) {
      console.error('Error loading user data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-400">Dare2Earn</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{user.email}</span>
            <button
              onClick={signOut}
              className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
              title="Sign out"
            >
              <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="bg-gray-800 rounded-lg shadow px-6 py-8 mb-8">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCircleIcon className="h-16 w-16 text-indigo-400" />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold">
                Welcome back, {username || 'Daredevil'}! 👋
              </h2>
              <p className="text-gray-400">Ready to take on some dares?</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          <div className="bg-indigo-900/50 rounded-lg shadow px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500/20 p-3 rounded-full">
                <FireIcon className="h-6 w-6 text-indigo-300" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-300 truncate">Active Dares</p>
                <p className="mt-1 text-2xl font-semibold text-white">0</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-900/50 rounded-lg shadow px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500/20 p-3 rounded-full">
                <TrophyIcon className="h-6 w-6 text-indigo-300" />
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-300 truncate">Total Won</p>
                <p className="mt-1 text-2xl font-semibold text-white">0 ETB</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-900/50 rounded-lg shadow px-6 py-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500/20 p-3 rounded-full">
                <svg className="h-6 w-6 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-300 truncate">Dare Streak</p>
                <p className="mt-1 text-2xl font-semibold text-white">0 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <button
            onClick={() => navigate('/create-dare')}
            className="relative block w-full border-2 border-gray-700 border-dashed rounded-lg p-12 text-center hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-300">Create a New Dare</span>
          </button>
          
          <button
            onClick={() => navigate('/browse')}
            className="relative block w-full border-2 border-gray-700 border-dashed rounded-lg p-12 text-center hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="mt-2 block text-sm font-medium text-gray-300">Browse Dares</span>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="relative block w-full border-2 border-gray-700 border-dashed rounded-lg p-12 text-center hover:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-300">View Profile</span>
          </button>
        </div>
      </main>
    </div>
  );
}

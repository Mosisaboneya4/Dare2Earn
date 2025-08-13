import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  FireIcon, 
  TrophyIcon, 
  CurrencyDollarIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function UserDashboard({ user }) {
  const [stats, setStats] = useState({
    totalDares: 0,
    completedDares: 0,
    totalEarnings: 0,
    currentRank: 0
  });
  const [recentDares, setRecentDares] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // In a real app, you'd fetch this data from your API
      setStats({
        totalDares: 12,
        completedDares: 8,
        totalEarnings: 250.00,
        currentRank: 45
      });
      
      setRecentDares([
        {
          id: 1,
          title: "Dance Challenge",
          status: "completed",
          prize: 50.00,
          participants: 23
        },
        {
          id: 2,
          title: "Fitness Challenge",
          status: "active",
          prize: 75.00,
          participants: 15
        }
      ]);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Dispatch custom event to notify App.js of logout
      window.dispatchEvent(new CustomEvent('authStateChange', {
        detail: { action: 'logout' }
      }));
      
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Dare2Earn</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <BellIcon className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <UserCircleIcon className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            Welcome back, {user?.full_name || user?.username}! 👋
          </h2>
          <p className="text-gray-400">Ready to take on some new challenges?</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FireIcon className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Dares</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDares}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedDares}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">#{stats.currentRank}</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Rank</p>
                <p className="text-2xl font-bold text-gray-900">#{stats.currentRank}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors">
            <PlusIcon className="h-6 w-6" />
            <span className="font-medium">Create New Dare</span>
          </button>
          
          <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors">
            <FireIcon className="h-6 w-6 text-orange-500" />
            <span className="font-medium">Browse Active Dares</span>
          </button>
          
          <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors">
            <TrophyIcon className="h-6 w-6 text-yellow-500" />
            <span className="font-medium">View Leaderboard</span>
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Dares</h3>
          <div className="space-y-4">
            {recentDares.map((dare) => (
              <div key={dare.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{dare.title}</h4>
                  <p className="text-sm text-gray-500">{dare.participants} participants</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    dare.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {dare.status}
                  </span>
                  <span className="font-bold text-green-600">${dare.prize}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  UsersIcon, 
  FireIcon, 
  TrophyIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import DaresManagement from './DaresManagement';

export default function AdminDashboard({ user }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDares: 0,
    activeUsers: 0,
    totalRevenue: 0,
    pendingReports: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentDares, setRecentDares] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      // In a real app, you'd fetch this data from your admin API endpoints
      setStats({
        totalUsers: 1247,
        totalDares: 89,
        activeUsers: 342,
        totalRevenue: 15420.00,
        pendingReports: 5
      });
      
      setRecentUsers([
        {
          id: 1,
          username: "johndoe",
          email: "john@example.com",
          joinDate: "2025-08-13",
          status: "active"
        },
        {
          id: 2,
          username: "jansmith",
          email: "jane@example.com", 
          joinDate: "2025-08-12",
          status: "active"
        }
      ]);

      setRecentDares([
        {
          id: 1,
          title: "Dance Challenge",
          creator: "Alice Cooper",
          status: "active",
          participants: 23,
          prize: 150.00
        },
        {
          id: 2,
          title: "Fitness Challenge",
          creator: "Bob Wilson",
          status: "pending",
          participants: 15,
          prize: 200.00
        }
      ]);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin dashboard');
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
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-2xl font-bold text-blue-600 hover:text-blue-700">Dare2Earn</Link>
              <div className="flex items-center space-x-2 bg-red-100 text-red-800 px-3 py-1 rounded-full">
                <ShieldCheckIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Admin Panel</span>
              </div>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-4 ml-4">
                <Link 
                  to="/admin" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isHomeRoute ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center">
                    <HomeIcon className="h-5 w-5 mr-1" />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <Link 
                  to="/admin/dares" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${isDaresRoute ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  <div className="flex items-center">
                    <FireIcon className="h-5 w-5 mr-1" />
                    <span>Dares</span>
                  </div>
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <BellIcon className="h-6 w-6" />
                {stats.pendingReports > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.pendingReports}
                  </span>
                )}
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-red-600 font-medium uppercase">{user?.role}</p>
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
        <Routes>
          <Route path="/admin/dares" element={<DaresManagement />} />
          <Route
            path="/"
            element={
              <>
                {/* Welcome Section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Admin Dashboard 🛡️
                  </h2>
                  <p className="text-gray-400">Monitor and manage your Dare2Earn platform</p>
                </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </div>

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
                <ChartBarIcon className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors">
            <UsersIcon className="h-6 w-6" />
            <span className="font-medium">Manage Users</span>
          </button>
          
          <button className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors">
            <FireIcon className="h-6 w-6" />
            <span className="font-medium">Manage Dares</span>
          </button>
          
          <button className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors">
            <ChartBarIcon className="h-6 w-6" />
            <span className="font-medium">Analytics</span>
          </button>
          
          <button className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-6 flex items-center justify-center space-x-3 transition-colors">
            <ExclamationTriangleIcon className="h-6 w-6" />
            <span className="font-medium">Review Reports</span>
          </button>
        </div>

        {/* Data Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Users</h3>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{user.username}</h4>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">Joined {user.joinDate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                    <div className="flex space-x-1">
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-800">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Dares */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Recent Dares</h3>
            <div className="space-y-4">
              {recentDares.map((dare) => (
                <div key={dare.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{dare.title}</h4>
                    <p className="text-sm text-gray-500">by {dare.creator}</p>
                    <p className="text-xs text-gray-400">{dare.participants} participants</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      dare.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : dare.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {dare.status}
                    </span>
                    <span className="font-bold text-green-600">${dare.prize}</span>
                    <div className="flex space-x-1">
                      <button className="p-1 text-blue-600 hover:text-blue-800">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:text-gray-800">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:text-red-800">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
          to="/admin"
          className={`flex flex-col items-center px-4 py-2 rounded-lg ${isHomeRoute ? 'text-blue-600' : 'text-gray-600'}`}
        >
          <HomeIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Dashboard</span>
        </Link>
        <Link 
          to="/admin/dares"
          className={`flex flex-col items-center px-4 py-2 rounded-lg ${isDaresRoute ? 'text-blue-600' : 'text-gray-600'}`}
        >
          <FireIcon className="h-6 w-6" />
          <span className="text-xs mt-1">Dares</span>
        </Link>
      </div>
      
      <style jsx global>{`
        /* Add some padding to the bottom of the page to account for fixed mobile nav */
        @media (max-width: 768px) {
          body {
            padding-bottom: 72px;
          }
        }
      `}</style>
    </div>
  );
}

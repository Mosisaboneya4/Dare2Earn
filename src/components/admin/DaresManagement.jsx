import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  VideoCameraIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

export default function DaresManagement() {
  const [dares, setDares] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDare, setEditingDare] = useState(null);
  
  // Get auth token from localStorage with multiple fallback options
  const getAuthToken = () => {
    // Try different possible token keys
    const possibleKeys = ['authToken', 'access_token', 'token', 'jwt', 'auth_token'];
    
    for (const key of possibleKeys) {
      const token = localStorage.getItem(key);
      if (token) {
        console.log(`Found token with key: ${key}`);
        return token;
      }
    }
    
    // Also check sessionStorage
    for (const key of possibleKeys) {
      const token = sessionStorage.getItem(key);
      if (token) {
        console.log(`Found token in sessionStorage with key: ${key}`);
        return token;
      }
    }
    
    console.log('No authentication token found in localStorage or sessionStorage');
    console.log('Available localStorage keys:', Object.keys(localStorage));
    return '';
  };
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entry_fee: '',
    required_media_type: 'image',
    category_id: '',
    start_time: '',
    end_time: ''
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  // Fetch all dares
  const fetchDares = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/dares');
      if (!response.ok) throw new Error('Failed to fetch dares');
      const data = await response.json();
      setDares(data.dares || []);
    } catch (error) {
      console.error('Error fetching dares:', error);
      toast.error('Failed to load dares');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDares();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'entry_fee' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Please log in to create dares');
        return;
      }
      
      if (editingDare) {
        const response = await fetch(`http://localhost:5000/api/dares/${editingDare.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update dare');
        }
        toast.success('Dare updated successfully');
      } else {
        const response = await fetch('http://localhost:5000/api/dares', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            // Ensure dates are in ISO format
            start_time: new Date(formData.start_time).toISOString(),
            end_time: new Date(formData.end_time).toISOString()
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error:', errorData);
          throw new Error(errorData.error || 'Failed to create dare');
        }
        toast.success('Dare created successfully');
      }
      
      setShowCreateModal(false);
      setEditingDare(null);
      fetchDares();
    } catch (error) {
      console.error('Error saving dare:', error);
      toast.error(`Failed to ${editingDare ? 'update' : 'create'} dare: ${error.message}`);
    }
  };

  const handleEdit = (dare) => {
    setEditingDare(dare);
    setFormData({
      title: dare.title,
      description: dare.description,
      entry_fee: dare.entry_fee,
      required_media_type: dare.required_media_type,
      category_id: dare.category_id,
      start_time: dare.start_time,
      end_time: dare.end_time
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (dareId) => {
    if (!window.confirm('Are you sure you want to delete this dare?')) return;
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error('Please log in to delete dares');
        return;
      }
      
      const response = await fetch(`http://localhost:5000/api/dares/${dareId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete dare');
      }
      
      toast.success('Dare deleted successfully');
      fetchDares();
    } catch (error) {
      console.error('Error deleting dare:', error);
      toast.error('Failed to delete dare');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      open: 'bg-green-100 text-green-800',
      closed: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Manage Dares</h1>
          <button
            onClick={() => {
              setEditingDare(null);
              setFormData({
                title: '',
                description: '',
                entry_fee: '',
                required_media_type: 'image',
                category_id: '',
                start_time: '',
                end_time: ''
              });
              setShowCreateModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Create New Dare</span>
          </button>
        </div>

        {/* Dares Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : dares.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No dares found
                    </td>
                  </tr>
                ) : (
                  dares.map((dare) => (
                    <tr key={dare.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{dare.title}</div>
                        <div className="text-sm text-gray-500">{dare.category_name || 'No Category'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${parseFloat(dare.entry_fee).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {dare.required_media_type === 'video' ? (
                            <>
                              <VideoCameraIcon className="h-4 w-4 text-purple-500 mr-1" />
                              <span className="text-sm text-gray-500">Video</span>
                            </>
                          ) : (
                            <>
                              <PhotoIcon className="h-4 w-4 text-blue-500 mr-1" />
                              <span className="text-sm text-gray-500">Image</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(dare.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(dare)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(dare.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Dare Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/80 to-gray-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-5xl w-full max-h-[95vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Animated Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 opacity-90"></div>
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                  backgroundSize: '60px 60px'
                }}
              ></div>
              
              <div className="relative px-8 py-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-white/30 rounded-2xl blur-lg"></div>
                      <div className="relative bg-white/20 backdrop-blur-sm rounded-2xl p-3 border border-white/30">
                        {editingDare ? (
                          <PencilIcon className="h-7 w-7 text-white drop-shadow-lg" />
                        ) : (
                          <PlusIcon className="h-7 w-7 text-white drop-shadow-lg" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                        {editingDare ? '✨ Edit Your Dare' : '🚀 Create Amazing Dare'}
                      </h2>
                      <p className="text-white/80 text-base drop-shadow">
                        {editingDare ? 'Perfect your dare with these updates' : 'Craft an exciting challenge for your community'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-white/80 hover:text-white transition-all duration-200 p-2 hover:bg-white/20 rounded-xl backdrop-blur-sm border border-white/20 hover:border-white/40"
                  >
                    <XCircleIcon className="h-7 w-7 drop-shadow" />
                  </button>
                </div>
              </div>
            </div>

            {/* Elegant Form Content */}
            <div className="max-h-[calc(95vh-160px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <form onSubmit={handleSubmit} className="p-8 space-y-10">
                
                {/* Title & Description - Hero Section */}
                <div className="space-y-8">
                  <div className="text-center pb-6 border-b border-gradient-to-r from-transparent via-gray-200 to-transparent">
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-blue-200/50">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">DARE DETAILS</span>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    {/* Title Input */}
                    <div className="group">
                      <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🎯</span> Dare Title
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="Create something that will make people stop scrolling..."
                          className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50/50 hover:to-purple-50/30 placeholder-gray-400 shadow-sm hover:shadow-md group-hover:shadow-lg font-medium"
                          required
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <div className={`w-3 h-3 rounded-full ${formData.title ? 'bg-green-400 animate-pulse' : 'bg-gray-300'} transition-all duration-300`}></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-1 flex items-center">
                        <span className="mr-1">💡</span> Make it catchy and descriptive - this is what grabs attention!
                      </p>
                    </div>

                    {/* Description Input */}
                    <div className="group">
                      <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">📝</span> Dare Description
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          placeholder="Tell participants exactly what they need to do. Be specific about rules, requirements, and what makes a winning submission. The more detailed, the better!"
                          rows={5}
                          className="w-full px-6 py-4 text-base border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gradient-to-br from-gray-50 to-blue-50/30 hover:from-blue-50/50 hover:to-purple-50/30 placeholder-gray-400 resize-none shadow-sm hover:shadow-md group-hover:shadow-lg leading-relaxed"
                          required
                        />
                        <div className="absolute right-4 bottom-4 text-gray-400">
                          <div className={`w-3 h-3 rounded-full ${formData.description ? 'bg-green-400 animate-pulse' : 'bg-gray-300'} transition-all duration-300`}></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-1 flex items-center">
                        <span className="mr-1">📋</span> Clear rules lead to better submissions and happier participants
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configuration Section */}
                <div className="space-y-8">
                  <div className="text-center pb-6 border-b border-gradient-to-r from-transparent via-gray-200 to-transparent">
                    <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-2 rounded-full border border-emerald-200/50">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">DARE CONFIGURATION</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Category Selection */}
                    <div className="group">
                      <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🏷️</span> Category
                      </label>
                      <div className="relative">
                        <select
                          name="category_id"
                          value={formData.category_id}
                          onChange={handleInputChange}
                          className="w-full px-6 py-4 text-base border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-emerald-50/30 hover:from-emerald-50/50 hover:to-teal-50/30 appearance-none shadow-sm hover:shadow-md group-hover:shadow-lg font-medium cursor-pointer"
                        >
                          <option value="" className="text-gray-500">🎪 Choose a category (optional)</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id} className="text-gray-800">
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-1 flex items-center">
                        <span className="mr-1">🔍</span> Help participants discover your dare more easily
                      </p>
                    </div>

                    {/* Media Type Selection */}
                    <div className="group">
                      <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">📸</span> Submission Type
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <label className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 group/option hover:scale-105 ${
                          formData.required_media_type === 'image' 
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-100 shadow-lg shadow-blue-500/25' 
                            : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-gray-300 hover:shadow-md'
                        }`}>
                          <input
                            type="radio"
                            name="required_media_type"
                            value="image"
                            checked={formData.required_media_type === 'image'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                            formData.required_media_type === 'image' 
                              ? 'bg-blue-500 text-white shadow-lg' 
                              : 'bg-gray-200 text-gray-600 group-hover/option:bg-gray-300'
                          }`}>
                            <PhotoIcon className="h-6 w-6" />
                          </div>
                          <span className={`font-bold text-lg transition-all duration-300 ${
                            formData.required_media_type === 'image' ? 'text-blue-700' : 'text-gray-700'
                          }`}>Photo</span>
                          <span className="text-sm text-gray-500 text-center mt-1">Perfect for visual challenges</span>
                          {formData.required_media_type === 'image' && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </label>
                        <label className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 group/option hover:scale-105 ${
                          formData.required_media_type === 'video' 
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-100 shadow-lg shadow-purple-500/25' 
                            : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 hover:border-gray-300 hover:shadow-md'
                        }`}>
                          <input
                            type="radio"
                            name="required_media_type"
                            value="video"
                            checked={formData.required_media_type === 'video'}
                            onChange={handleInputChange}
                            className="sr-only"
                          />
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${
                            formData.required_media_type === 'video' 
                              ? 'bg-purple-500 text-white shadow-lg' 
                              : 'bg-gray-200 text-gray-600 group-hover/option:bg-gray-300'
                          }`}>
                            <VideoCameraIcon className="h-6 w-6" />
                          </div>
                          <span className={`font-bold text-lg transition-all duration-300 ${
                            formData.required_media_type === 'video' ? 'text-purple-700' : 'text-gray-700'
                          }`}>Video</span>
                          <span className="text-sm text-gray-500 text-center mt-1">Great for action & stories</span>
                          {formData.required_media_type === 'video' && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Entry Fee & Timing */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Entry Fee */}
                    <div className="group">
                      <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">💰</span> Entry Fee
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                          <span className="text-gray-400 text-xl font-bold">$</span>
                        </div>
                        <input
                          type="number"
                          name="entry_fee"
                          value={formData.entry_fee}
                          onChange={handleInputChange}
                          placeholder="5.00"
                          step="0.01"
                          min="0"
                          className="w-full pl-12 pr-6 py-4 text-lg font-semibold border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-green-50/30 hover:from-green-50/50 hover:to-emerald-50/30 placeholder-gray-400 shadow-sm hover:shadow-md group-hover:shadow-lg"
                          required
                        />
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <div className={`w-3 h-3 rounded-full ${formData.entry_fee ? 'bg-green-400 animate-pulse' : 'bg-gray-300'} transition-all duration-300`}></div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-1 flex items-center">
                        <span className="mr-1">🎯</span> Higher fees = bigger prizes!
                      </p>
                    </div>

                    {/* Start Date */}
                    <div className="group">
                      <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🚀</span> Start Date
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          name="start_time"
                          value={formData.start_time}
                          onChange={handleInputChange}
                          className="w-full px-6 py-4 text-base border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-indigo-50/30 hover:from-indigo-50/50 hover:to-blue-50/30 shadow-sm hover:shadow-md group-hover:shadow-lg font-medium"
                          required
                        />
                        <ClockIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-1 flex items-center">
                        <span className="mr-1">⏰</span> When it all begins
                      </p>
                    </div>

                    {/* End Date */}
                    <div className="group">
                      <label className="block text-lg font-bold text-gray-800 mb-3 flex items-center">
                        <span className="mr-2">🏁</span> End Date
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          name="end_time"
                          value={formData.end_time}
                          onChange={handleInputChange}
                          className="w-full px-6 py-4 text-base border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 transition-all duration-300 bg-gradient-to-r from-gray-50 to-pink-50/30 hover:from-pink-50/50 hover:to-red-50/30 shadow-sm hover:shadow-md group-hover:shadow-lg font-medium"
                          required
                        />
                        <ClockIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-1 flex items-center">
                        <span className="mr-1">⏳</span> Submission deadline
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Preview */}
                {(formData.title || formData.description) && (
                  <div className="space-y-6">
                    <div className="text-center pb-6 border-b border-gradient-to-r from-transparent via-gray-200 to-transparent">
                      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-2 rounded-full border border-purple-200/50">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">LIVE PREVIEW</span>
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-3xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5"></div>
                      <div className="relative p-8">
                        <div className="flex items-start space-x-6">
                          <div className="flex-shrink-0">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                              formData.required_media_type === 'video' 
                                ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                                : 'bg-gradient-to-br from-blue-500 to-indigo-500'
                            }`}>
                              {formData.required_media_type === 'video' ? (
                                <VideoCameraIcon className="h-8 w-8 text-white" />
                              ) : (
                                <PhotoIcon className="h-8 w-8 text-white" />
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-2xl font-bold text-gray-900 mb-3">
                              {formData.title || '✨ Your Amazing Dare Title'}
                            </h4>
                            <p className="text-gray-700 text-base leading-relaxed mb-4">
                              {formData.description || 'Your detailed dare description will appear here, showing participants exactly what they need to do to win...'}
                            </p>
                            <div className="flex items-center space-x-4">
                              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">
                                <span className="mr-1">💰</span> ${formData.entry_fee || '0.00'} to join
                              </div>
                              <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                                <span className="mr-1">{formData.required_media_type === 'video' ? '🎬' : '📸'}</span>
                                {formData.required_media_type === 'video' ? 'Video' : 'Photo'} required
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-8 border-t-2 border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-8 py-4 border-2 border-gray-300 rounded-2xl text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-12 py-4 border-2 border-transparent rounded-2xl text-base font-bold text-white bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-200 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {editingDare ? (
                      <>
                        <CheckCircleIcon className="h-6 w-6" />
                        <span>✨ Update Dare</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-6 w-6" />
                        <span>🚀 Create Dare</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

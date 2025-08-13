// API client to replace Supabase functionality
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return { data, error: null };
    } catch (error) {
      console.error('API request failed:', error);
      return { data: null, error };
    }
  }

  // Auth methods (mimicking Supabase API)
  auth = {
    signUp: async (credentials) => {
      const { data, error } = await this.request('/auth/signup', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
          username: credentials.options?.data?.username || credentials.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
          full_name: credentials.options?.data?.full_name || credentials.email.split('@')[0],
          phone_number: credentials.options?.data?.phone_number || null,
        },
      });

      if (!error && data?.token) {
        this.setToken(data.token);
        return {
          data: {
            user: data.user,
            session: { access_token: data.token }
          },
          error: null
        };
      }

      return { data: null, error };
    },

    signInWithPassword: async (credentials) => {
      const { data, error } = await this.request('/auth/signin', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      });

      if (!error && data?.token) {
        this.setToken(data.token);
        // Store user data including role in localStorage
        localStorage.setItem('user_data', JSON.stringify(data.user));
        return {
          data: {
            user: data.user,
            session: { access_token: data.token }
          },
          error: null
        };
      }

      return { data: null, error };
    },

    signInWithOtp: async (credentials) => {
      // For magic link functionality - would need email service
      return { 
        data: null, 
        error: new Error('Magic link sign-in not yet implemented with local database') 
      };
    },

    signInWithOAuth: async (options) => {
      // OAuth functionality would need separate implementation
      return { 
        data: null, 
        error: new Error('OAuth sign-in not yet implemented with local database') 
      };
    },

    signOut: async () => {
      const { data, error } = await this.request('/auth/logout', {
        method: 'POST',
      });
      
      this.setToken(null);
      // Clear stored user data
      localStorage.removeItem('user_data');
      return { data, error };
    },

    getUser: async () => {
      if (!this.token) {
        return { data: { user: null }, error: null };
      }

      const { data, error } = await this.request('/auth/user');
      
      if (!error && data?.user) {
        // Store the complete user object including role
        const userWithRole = {
          ...data.user,
          // Ensure we have role information from the stored user data
          role: data.user.role || 'user'
        };
        
        return {
          data: { user: userWithRole },
          error: null
        };
      }

      if (error && error.message.includes('Invalid or expired')) {
        this.setToken(null);
      }

      return { data: { user: null }, error };
    },

    updateUser: async (updates) => {
      const { data, error } = await this.request('/auth/user', {
        method: 'PUT',
        body: updates,
      });

      return { data: data?.user ? { user: data.user } : null, error };
    },
  };

  // RPC method (for stored procedures)
  rpc = async (functionName, params = {}) => {
    if (functionName === 'create_new_user') {
      // This is handled by the signup endpoint now
      return { data: null, error: new Error('Use auth.signUp instead') };
    }
    
    return { data: null, error: new Error(`RPC function ${functionName} not implemented`) };
  };

  // Database query methods
  from = (table) => {
    return {
      select: async (columns = '*') => {
        const endpoint = table === 'profiles' ? '/auth/user' : `/api/${table}`;
        const { data, error } = await this.request(endpoint);
        return { data: data ? (Array.isArray(data) ? data : [data]) : [], error };
      },
      
      insert: async (values) => {
        const { data, error } = await this.request(`/api/${table}`, {
          method: 'POST',
          body: values,
        });
        return { data, error };
      },
      
      update: async (values) => {
        const { data, error } = await this.request(`/api/${table}`, {
          method: 'PUT',
          body: values,
        });
        return { data, error };
      },
      
      delete: async () => {
        const { data, error } = await this.request(`/api/${table}`, {
          method: 'DELETE',
        });
        return { data, error };
      },
    };
  };
}

// Create and export the API client instance
export const supabase = new ApiClient();

// For compatibility with existing code
export default supabase;

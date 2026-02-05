import api from "../utils/axiosConfig";

// User Service object
const userService = {
  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - User's phone number
   * @param {string} name - User's full name
   * @returns {Promise} - API response
   */
  sendOTP: async (phone, name) => {
    try {
      const response = await api.post('/users/send-otp', {
        phone,
        name,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to send OTP' };
    }
  },

  /**
   * Verify OTP and complete authentication
   * @param {string} phoneNumber - User's phone number
   * @param {string} otp - OTP code
   * @returns {Promise} - API response with token and user data
   */
  verifyOTP: async (phone, sessionId, otp, name) => {
    try {
      const response = await api.post('/users/verify-otp', {
        phone,
        sessionId,
        otp,
        name,
      });
      
      // Store token and user data
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to verify OTP' };
    }
  },

  /**
   * Get current user's profile
   * @returns {Promise} - User profile data
   */
  getMyProfile: async () => {
    try {
      const response = await api.get('/users/me');
      
      // Update local storage with latest user data
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch profile' };
    }
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @param {string} profileData.name - User's name
   * @param {string} profileData.profilePicture - Profile picture URL
   * @param {string} profileData.bio - User's bio
   * @returns {Promise} - Updated user data
   */
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/users/me', profileData);
      
      // Update local storage
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  /**
   * Update user settings
   * @param {Object} settings - Settings to update
   * @param {boolean} settings.notificationsEnabled - Enable/disable notifications
   * @param {string} settings.theme - Theme preference (light/dark)
   * @param {string} settings.language - Language preference
   * @returns {Promise} - Updated user data
   */
  updateSettings: async (settings) => {
    try {
      const response = await api.patch('/users/me/settings', settings);
      
      // Update local storage
      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update settings' };
    }
  },

  /**
   * Update user's online status
   * @param {string} status - Status: 'online', 'offline', 'away'
   * @returns {Promise} - API response
   */
  updateOnlineStatus: async (status) => {
    try {
      const response = await api.patch('/users/me/status', { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update status' };
    }
  },

  /**
   * Find users by phone numbers
   * @param {Array<string>} phoneNumbers - Array of phone numbers to search
   * @returns {Promise} - Array of found users
   */
  findUsersByPhones: async (phoneNumbers) => {
    try {
      const response = await api.post('/users/find-by-phones', {
        phoneNumbers,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to find users' };
    }
  },

  /**
   * Logout user
   * @returns {Promise} - API response
   */
  logout: async () => {
    try {
      const response = await api.post('/users/logout');
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      return response.data;
    } catch (error) {
      // Clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      throw error.response?.data || { message: 'Failed to logout' };
    }
  },

  /**
   * Get stored auth token
   * @returns {string|null} - Auth token or null
   */
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  /**
   * Get stored user data
   * @returns {Object|null} - User object or null
   */
  getStoredUser: () => {
    const userStr = localStorage.getItem('user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if user has valid token
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  /**
   * Clear all stored auth data
   */
  clearAuthData: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

export default userService;
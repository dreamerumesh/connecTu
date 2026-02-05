
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';

// Create User Context
const UserContext = createContext(undefined);
/**
 * Custom hook to use User Context
 * @returns {Object} - User context value
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

/**
 * User Provider Component
 * Manages user authentication and profile state
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Initialize user from localStorage on mount
   */
  useEffect(() => {
    const initializeUser = () => {
      try {
        const token = userService.getToken();
        const storedUser = userService.getStoredUser();

        if (token && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error initializing user:', err);
        userService.clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  /**
   * Send OTP to phone number
   */
  const sendOTP = useCallback(async (phone, name) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Sending OTP to:', phone, 'for user:', name);
      const response = await userService.sendOTP(phone, name);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to send OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Verify OTP and login user
   */
  const verifyOTP = useCallback(async (phone,sessionId, otp, name) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.verifyOTP(phone, sessionId, otp, name);
      
      if (response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to verify OTP';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch current user profile
   */
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getMyProfile();
      
      if (response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.updateProfile(profileData);
      
      if (response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user settings
   */
  const updateSettings = useCallback(async (settings) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.updateSettings(settings);
      
      if (response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update settings';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update online status
   */
  const updateOnlineStatus = useCallback(async (status) => {
    try {
      setError(null);
      const response = await userService.updateOnlineStatus(status);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update status';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Find users by phone numbers
   */
  const findUsersByPhones = useCallback(async (phoneNumbers) => {
    try {
      setError(null);
      const response = await userService.findUsersByPhones(phoneNumbers);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to find users';
      setError(errorMessage);
      throw err;
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await userService.logout();
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      const errorMessage = err.message || 'Failed to logout';
      setError(errorMessage);
      // Still clear state even if logout API fails
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update user state locally (without API call)
   */
  const updateUserLocally = useCallback((updates) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // Context value
  const value = {
    // State
    user,
    loading,
    error,
    isAuthenticated,

    // Authentication methods
    sendOTP,
    verifyOTP,
    logout,

    // Profile methods
    fetchProfile,
    updateProfile,
    updateSettings,
    updateOnlineStatus,

    // User search
    findUsersByPhones,

    // Utility methods
    clearError,
    updateUserLocally,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
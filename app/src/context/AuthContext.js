import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, removeItem } from '../services/storage';
import { showMessage } from 'react-native-flash-message';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await getItem('token');
      const storedUser = await getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);

      const response = await authAPI.login(email, password);

      if (response.success) {
        const { token: newToken, user: newUser } = response;
        await setItem('token', newToken);
        await setItem('user', JSON.stringify(newUser));
        
        setToken(newToken);
        setUser(newUser);

        showMessage({
          message: 'Login Successful',
          description: 'Welcome back!',
          type: 'success',
        });

        return { success: true };
      } else {
        showMessage({
          message: 'Login Failed',
          description: response.error || 'Invalid credentials',
          type: 'danger',
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      showMessage({
        message: 'Login Failed',
        description: 'Network error. Please try again.',
        type: 'danger',
      });
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);

      const response = await authAPI.register(userData);

      if (response.success) {
        const { token: newToken, user: newUser } = response;

        await setItem('token', newToken);
        await setItem('user', JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);

        showMessage({
          message: 'Registration Successful',
          description: 'Welcome to Afghanistan Marketplace!',
          type: 'success',
        });

        return { success: true };
      } else {
        showMessage({
          message: 'Registration Failed',
          description: response.error || 'Please try again',
          type: 'danger',
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      showMessage({
        message: 'Registration Failed',
        description: 'Network error. Please try again.',
        type: 'danger',
      });
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Call logout API if needed
      if (token) {
        await authAPI.logout();
      }
      
      await removeItem('token');
      await removeItem('user');

      setToken(null);
      setUser(null);

      showMessage({
        message: 'Logged Out',
        description: 'See you again soon!',
        type: 'info',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      setIsLoading(true);

      const response = await authAPI.updateProfile(profileData);

      if (response.success) {
        const updatedUser = response.user;
        await setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        showMessage({
          message: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
          type: 'success',
        });

        return { success: true };
      } else {
        showMessage({
          message: 'Update Failed',
          description: response.error || 'Please try again',
          type: 'danger',
        });
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      showMessage({
        message: 'Update Failed',
        description: 'Network error. Please try again.',
        type: 'danger',
      });
      return { success: false, error: 'Network error' };
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    checkAuthState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

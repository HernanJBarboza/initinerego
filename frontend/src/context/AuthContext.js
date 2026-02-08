import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, storageKeys } from '../utils/constants';
import api from '../services/api';

const AuthContext = createContext(null);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(storageKeys.TOKEN);
        const storedUser = await AsyncStorage.getItem(storageKeys.USER);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { access_token, user: userData } = response.data;

      // Store in AsyncStorage
      await AsyncStorage.setItem(storageKeys.TOKEN, access_token);
      await AsyncStorage.setItem(storageKeys.USER, JSON.stringify(userData));

      // Update state
      setToken(access_token);
      setUser(userData);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Error al iniciar sesión';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await api.post('/auth/register', userData);
      const { access_token, user: newUser } = response.data;

      // Store in AsyncStorage
      await AsyncStorage.setItem(storageKeys.TOKEN, access_token);
      await AsyncStorage.setItem(storageKeys.USER, JSON.stringify(newUser));

      // Update state
      setToken(access_token);
      setUser(newUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      return { success: true };
    } catch (err) {
      const message = err.response?.data?.detail || 'Error al registrar usuario';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(storageKeys.TOKEN);
      await AsyncStorage.removeItem(storageKeys.USER);
      delete api.defaults.headers.common['Authorization'];
      setToken(null);
      setUser(null);
    } catch (err) {
      console.error('Error during logout:', err);
    }
  }, []);

  const updateUser = useCallback(async () => {
    try {
      const response = await api.get('/users/me');
      const updatedUser = response.data;
      setUser(updatedUser);
      await AsyncStorage.setItem(storageKeys.USER, JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error('Error updating user:', err);
      return null;
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateUser,
    clearError: () => setError(null),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

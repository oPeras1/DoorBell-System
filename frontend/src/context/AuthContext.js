import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuthStatus } from '../services/auth';
import { Alert } from 'react-native';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await checkAuthStatus();
        if (token) {
          setUserToken(token);
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const authContext = {
    login: async (credentials) => {
      try {
        setIsLoading(true);
        const response = await apiLogin(credentials);
        setUserToken(response.token);
        return response;
      } catch (error) {
        Alert.alert('Login Failed', error.response?.data || 'Please check your credentials');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    
    register: async (userData) => {
      try {
        setIsLoading(true);
        const response = await apiRegister(userData);
        Alert.alert('Success', 'Registration successful! Please login.');
        return response;
      } catch (error) {
        Alert.alert('Registration Failed', error.response?.data || 'Please try again');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    
    logout: async () => {
      try {
        setIsLoading(true);
        await apiLogout();
        setUserToken(null);
        setUser(null);
      } catch (error) {
        console.error('Logout error', error);
        setUserToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    },
    
    user,
    userToken,
    isLoading
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};
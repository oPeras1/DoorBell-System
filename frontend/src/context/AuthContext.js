import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuthStatus } from '../services/auth';
import { getMe } from '../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Bootstrap: Verifica token/user salvo ao iniciar
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await checkAuthStatus();
        const userJson = await AsyncStorage.getItem('user');
        if (token) {
          setUserToken(token);
        }
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      } catch (e) {
        console.error('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  useEffect(() => {
    const validateUser = async () => {
      if (!userToken) {
        setUser(null);
        return;
      }
      try {
        const userData = await getMe();
        setUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        if (
          error.response &&
          [401, 403, 404].includes(error.response.status)
        ) {
          await authContext.logout();
        } else {
          console.error('Erro ao validar usuário logado:', error);
        }
      }
    };

    validateUser();
  }, [userToken]);

  const authContext = {
    login: async (credentials) => {
      try {
        const response = await apiLogin(credentials);
        setUserToken(response.token);
        if (response.user) {
          setUser(response.user);
          await AsyncStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
      } catch (error) {
        throw error;
      }
    },

    register: async (userData) => {
      try {
        const response = await apiRegister(userData);
        return response;
      } catch (error) {
        throw error;
      }
    },

    logout: async () => {
      try {
        setIsLoading(true);
        await apiLogout();
        setUserToken(null);
        setUser(null);
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userToken');
      } catch (error) {
        setUserToken(null);
        setUser(null);
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userToken');
      } finally {
        setIsLoading(false);
      }
    },

    user,
    userToken,
    isLoading,
    setUser,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};
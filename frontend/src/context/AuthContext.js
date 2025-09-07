import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, checkAuthStatus } from '../services/auth';
import { getMe, requestNotificationPermission, checkNotificationPermission, removeOneSignalId } from '../services/userService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';

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
        
        // Check and request notification permission if needed
        await checkAndRequestNotifications();
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

  const checkAndRequestNotifications = async () => {
    try {
      // Wait for OneSignal to be ready on web
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && !window.OneSignal) {
          // Wait for OneSignal to load
          await new Promise(resolve => {
            const checkOneSignal = () => {
              if (window.OneSignal) {
                resolve();
              } else {
                setTimeout(checkOneSignal, 100);
              }
            };
            window.addEventListener('onesignalReady', resolve, { once: true });
            checkOneSignal();
          });
        }
      }

      const hasPermission = await checkNotificationPermission();
      if (!hasPermission) {
        // Show permission request
        if (Platform.OS === 'web') {
          // For web, show a custom confirmation
          const userWantsNotifications = window.confirm(
            'Would you like to receive notifications for door access and events?'
          );
          if (userWantsNotifications) {
            await requestNotificationPermission();
          }
        } else {
          // For mobile, show native Alert
          Alert.alert(
            'Enable Notifications',
            'Would you like to receive notifications for door access and events?',
            [
              {
                text: 'Not Now',
                style: 'cancel',
              },
              {
                text: 'Enable',
                onPress: async () => {
                  await requestNotificationPermission();
                },
              },
            ]
          );
        }
      }
    } catch (error) {
      console.warn('Failed to check/request notifications:', error);
    }
  };

  const authContext = {
    login: async (credentials) => {
      try {
        const response = await apiLogin(credentials);
        setUserToken(response.token);
        if (response.user) {
          setUser(response.user);
          await AsyncStorage.setItem('user', JSON.stringify(response.user));
        }
        
        // Request notification permission after successful login
        setTimeout(async () => {
          await checkAndRequestNotifications();
        }, 1000);
        
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
        // Remove OneSignal ID before logout
        await removeOneSignalId();
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
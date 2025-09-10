import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OneSignal } from 'react-native-onesignal';
import { Platform } from 'react-native';

const getOneSignalPlayerId = async () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.OneSignal) {
        const playerId = window.OneSignal.User?.onesignalId || null;
        return playerId;
      }
    } catch (error) {
      console.warn('Failed to get OneSignal ID on web:', error);
    }
    return null;
  }
  
  try {
    const playerId = await OneSignal.User.getOnesignalId();
    return playerId;
  } catch (error) {
    console.warn('Failed to get OneSignal ID:', error);
    return null;
  }
};

export const login = async (credentials) => {
  try {
    const onesignalId = await getOneSignalPlayerId();
    const requestData = {
      ...credentials,
      onesignalId
    };
    
    const response = await api.post(API_ENDPOINTS.LOGIN, requestData);
    const { token, user } = response.data;
    
    // Save token and user to AsyncStorage
    if (token) {
      await AsyncStorage.setItem('userToken', token);
    }
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const onesignalId = await getOneSignalPlayerId();
    let requestData = {
      ...userData,
      onesignalId
    };

    if (requestData.birthdate && /^\d{2}-\d{2}-\d{4}$/.test(requestData.birthdate)) {
      const [day, month, year] = requestData.birthdate.split('-');
      requestData.birthdate = `${year}-${month}-${day}`;
    }

    const response = await api.post(API_ENDPOINTS.REGISTER, requestData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    const onesignalId = await getOneSignalPlayerId();
    if (onesignalId) {
      await api.delete(API_ENDPOINTS.USER_ME + '/onesignal', {
        data: { onesignalId }
      });
    }
    await api.post(API_ENDPOINTS.LOGOUT);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    return true;
  } catch (error) {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    return false;
  }
};

export const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return token;
  } catch (error) {
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USER_ME);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const requestPasswordReset = async (username) => {
  try {
    const response = await api.post(API_ENDPOINTS.FORGOT_PASSWORD, { username });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPasswordResetStatus = async (username) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.FORGOT_PASSWORD_STATUS}/${username}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (username, password) => {
  try {
    const response = await api.post(API_ENDPOINTS.RESET_PASSWORD, { username, password });
    return response.data;
  } catch (error) {
    throw error;
  }
};
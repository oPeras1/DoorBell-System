import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (credentials) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
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
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post(API_ENDPOINTS.LOGOUT);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('user');
    return true;
  } catch (error) {
    // Remove token and user from AsyncStorage even if the server request fails
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
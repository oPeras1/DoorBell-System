import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = async (credentials) => {
  try {
    const response = await api.post(API_ENDPOINTS.LOGIN, credentials);
    const { token } = response.data;
    
    // Save token to AsyncStorage
    if (token) {
      await AsyncStorage.setItem('userToken', token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post(API_ENDPOINTS.REGISTER, userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post(API_ENDPOINTS.LOGOUT);
    await AsyncStorage.removeItem('userToken');
    return true;
  } catch (error) {
    console.error('Logout error:', error.response?.data || error.message);
    // Remove token from AsyncStorage even if the server request fails
    await AsyncStorage.removeItem('userToken');
    return false;
  }
};

export const checkAuthStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    return token;
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
};
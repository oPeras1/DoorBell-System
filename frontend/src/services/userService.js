import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
import { OneSignal } from 'react-native-onesignal';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAllUsers = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getMe = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USER_ME);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateOneSignalId = async () => {
  if (Platform.OS === 'web') return;

  try {
    const onesignalId = await OneSignal.User.getOnesignalId();
    if (onesignalId) {
      await api.put(`${API_ENDPOINTS.USER_ME}/onesignal`, { onesignalId });
    }
  } catch (error) {
    console.warn('Failed to update OneSignal ID:', error);
  }
};

export const getUserById = async (userId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.USERS}${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserStatus = async (status) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USER_ME}/status`, { status });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserMuted = async (userId, muted) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USERS}muted`, { targetId: userId, muted });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserType = async (userId, type) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USERS}${userId}/type`, { type });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUsername = async (userId, username) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USERS}${userId}/username`, { username });
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateBirthdate = async (userId, birthdate) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USERS}${userId}/birthdate`, { birthdate });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRegistrationStatus = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.REGISTRATION_STATUS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const blockRegistration = async () => {
  try {
    const response = await api.post(API_ENDPOINTS.BLOCK_REGISTRATION);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const unblockRegistration = async () => {
  try {
    const response = await api.post(API_ENDPOINTS.UNBLOCK_REGISTRATION);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`${API_ENDPOINTS.USERS}${userId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateMultipleDoorOpen = async (multiple) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USER_ME}/multipledoors`, { multiple });
    return response.data;
  } catch (error) {
    throw error;
  }
};

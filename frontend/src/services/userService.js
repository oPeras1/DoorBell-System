import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';
import { OneSignal } from 'react-native-onesignal';
import { Platform } from 'react-native';

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

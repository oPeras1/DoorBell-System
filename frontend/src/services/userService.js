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

const getOneSignalId = async () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.OneSignal) {
        const onesignalId = await window.OneSignal.User.getOnesignalId();
        return onesignalId;
      }
    } catch (error) {
      console.warn('Failed to get OneSignal ID on web:', error);
    }
    return null;
  }

  try {
    const onesignalId = await OneSignal.User.getOnesignalId();
    return onesignalId;
  } catch (error) {
    console.warn('Failed to get OneSignal ID:', error);
    return null;
  }
};

export const updateOneSignalId = async () => {
  try {
    const onesignalId = await getOneSignalId();
    if (onesignalId) {
      await api.put(`${API_ENDPOINTS.USER_ME}/onesignal`, { onesignalId });
      console.log('OneSignal ID updated successfully');
    }
  } catch (error) {
    console.warn('Failed to update OneSignal ID:', error);
  }
};

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.OneSignal) {
        // Wait for OneSignal to be ready if it isn't already
        if (!window.OneSignal.Notifications) {
          await new Promise(resolve => {
            const checkReady = () => {
              if (window.OneSignal.Notifications) {
                resolve();
              } else {
                setTimeout(checkReady, 100);
              }
            };
            checkReady();
          });
        }

        const permission = await window.OneSignal.Notifications.requestPermission();
        if (permission) {
          // Wait a bit for OneSignal to process the permission and get the ID
          setTimeout(async () => {
            await updateOneSignalId();
          }, 1500);
        }
        return permission;
      }
      return false;
    } catch (error) {
      console.warn('Failed to request notification permission on web:', error);
      return false;
    }
  }

  try {
    const permission = await OneSignal.Notifications.requestPermission(true);
    if (permission) {
      await updateOneSignalId();
    }
    return permission;
  } catch (error) {
    console.warn('Failed to request notification permission:', error);
    return false;
  }
};

export const removeOneSignalId = async () => {
  try {
    const onesignalId = await getOneSignalId();
    if (onesignalId) {
      await api.delete(`${API_ENDPOINTS.USER_ME}/onesignal`, {
        data: { onesignalId }
      });
      console.log('OneSignal ID removed successfully');
    }
  } catch (error) {
    console.warn('Failed to remove OneSignal ID:', error);
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

// Check if user has notification permission (for checking if we should show the prompt)
export const checkNotificationPermission = async () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.OneSignal && window.OneSignal.Notifications) {
        const permission = await window.OneSignal.Notifications.getPermission();
        return permission;
      }
      return false;
    } catch (error) {
      console.warn('Failed to check notification permission on web:', error);
      return false;
    }
  }

  try {
    const permission = await OneSignal.Notifications.getPermission();
    return permission;
  } catch (error) {
    console.warn('Failed to check notification permission:', error);
    return false;
  }
};
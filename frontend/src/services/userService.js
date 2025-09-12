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
        // Web v16: property, não método
        const onesignalId = window.OneSignal.User?.onesignalId || null;
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
        // Garantir que Notifications existe
        if (!window.OneSignal.Notifications) {
          await new Promise(resolve => {
            const tick = () =>
              window.OneSignal?.Notifications ? resolve() : setTimeout(tick, 100);
            tick();
          });
        }

        // Ask permission
        await window.OneSignal.Notifications.requestPermission();

        // Wait for subscription to be created (id + optedIn)
        await new Promise(resolve => {
          let timeoutId;
          const ready = () => {
            const id = window.OneSignal?.User?.PushSubscription?.id;
            const opted = window.OneSignal?.User?.PushSubscription?.optedIn;
            return Boolean(id && opted);
          };
          const done = () => { clearTimeout(timeoutId); resolve(); };
          // Already ready?
          if (ready()) return resolve();
          const onChange = (ev) => {
            if (ev?.current?.id && ev?.current?.optedIn) {
              try { window.OneSignal.User.PushSubscription.removeEventListener('change', onChange); } catch {}
              done();
            }
          };
          try { window.OneSignal.User.PushSubscription.addEventListener('change', onChange); } catch {}
          // Timeout
          timeoutId = setTimeout(() => {
            try { window.OneSignal.User.PushSubscription.removeEventListener('change', onChange); } catch {}
            resolve();
          }, 5000);
        });

        // Sync with backend
        await updateOneSignalId();
        return !!window.OneSignal.Notifications.permission;
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

export const updateUsername = async (userId, username) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USERS}${userId}/username`, { username });
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

export const updateMultipleDoorOpen = async (multiple) => {
  try {
    const response = await api.put(`${API_ENDPOINTS.USER_ME}/multipledoors`, { multiple });
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

// Check if user has notification permission (for checking if we should show the prompt)
export const checkNotificationPermission = async () => {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && window.OneSignal?.Notifications) {
        // Web v16: property boolean
        return !!window.OneSignal.Notifications.permission;
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

export const removeAllOneSignalIds = async (userId) => {
  try {
    const response = await api.delete(`${API_ENDPOINTS.USERS}${userId}/onesignal`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
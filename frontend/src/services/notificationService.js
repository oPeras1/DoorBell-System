import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const getUnreadNotifications = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.NOTIFICATIONS_UNREAD);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    throw error;
  }
};

export const getAllNotifications = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.NOTIFICATIONS_ALL);
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    await api.post(`${API_ENDPOINTS.NOTIFICATIONS_MARK_READ}/${notificationId}/read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

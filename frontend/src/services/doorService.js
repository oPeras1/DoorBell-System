import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const openDoor = async () => {
  try {
    const response = await api.post(API_ENDPOINTS.DOOR);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDoorPing = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.DOOR_PING);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getDoorEnvironment = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.DOOR_ENVIRONMENT);
    return response.data;
  } catch (error) {
    throw error;
  }
};
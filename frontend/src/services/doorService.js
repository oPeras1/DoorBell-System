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
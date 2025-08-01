import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const getAllUsers = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.USERS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

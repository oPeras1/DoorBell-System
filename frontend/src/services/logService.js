import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const getLogs = async (page = 0, size = 100) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.LOGS_PAGINATED}?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getLogsCount = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.LOGS_COUNT);
    return response.data;
  } catch (error) {
    throw error;
  }
};

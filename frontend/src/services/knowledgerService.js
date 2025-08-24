import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const getPasswordResetRequests = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PASSWORD_RESET_REQUESTS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const approvePasswordResetRequest = async (requestId) => {
  try {
    const response = await api.post(`${API_ENDPOINTS.APPROVE_PASSWORD_RESET}/${requestId}/approve`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const rejectPasswordResetRequest = async (requestId, reason) => {
  try {
    const response = await api.post(`${API_ENDPOINTS.REJECT_PASSWORD_RESET}/${requestId}/reject`, { reason });
    return response.data;
  } catch (error) {
    throw error;
  }
};

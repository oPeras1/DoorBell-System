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

export const getMaintenanceStatus = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.MAINTENANCE_STATUS);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const activateMaintenance = async () => {
  try {
    const response = await api.post(API_ENDPOINTS.MAINTENANCE_ACTIVATE);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deactivateMaintenance = async () => {
  try {
    const response = await api.post(API_ENDPOINTS.MAINTENANCE_DEACTIVATE);
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

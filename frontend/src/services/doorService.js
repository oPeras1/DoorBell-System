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
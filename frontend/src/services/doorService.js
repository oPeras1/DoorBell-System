import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const openDoor = async (coordinates = null) => {
  try {
    const requestBody = coordinates ? {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    } : {};
    
    const response = await api.post(API_ENDPOINTS.DOOR, requestBody);
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

export const getDoorOnlineStatus = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.DOOR_ONLINE);
    return response.data;
  } catch (error) {
    throw error;
  }
};
import api from './api';
import { API_ENDPOINTS } from '../config/apiConfig';

export const getParties = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.PARTIES);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createParty = async (partyData) => {
  try {
    const response = await api.post(API_ENDPOINTS.CREATE_PARTY, partyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteParty = async (partyId) => {
  try {
    await api.delete(`${API_ENDPOINTS.DELETE_PARTY}/${partyId}`);
  } catch (error) {
    throw error;
  }
};

export const getPartyById = async (partyId) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.PARTIES}${partyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching party details:', error);
    throw error;
  }
};

export const updateGuestStatus = async (partyId, userId, status) => {
  try {
    const payload = { status };
    if (userId) {
      payload.userId = userId;
    }
    await api.patch(`${API_ENDPOINTS.PARTIES}${partyId}/guest-status`, payload);
  } catch (error) {
    throw error;
  }
};

export const updatePartyStatus = async (partyId, status) => {
  try {
    const payload = { status };
    const response = await api.patch(`${API_ENDPOINTS.PARTIES}${partyId}/status`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addGuestToParty = async (partyId, userId) => {
  try {
    await api.post(`${API_ENDPOINTS.PARTIES}${partyId}/guests`, { userId });
  } catch (error) {
    throw error;
  }
};

export const removeGuestFromParty = async (partyId, guestUserId) => {
  try {
    await api.delete(`${API_ENDPOINTS.PARTIES}${partyId}/guests/${guestUserId}`);
  } catch (error) {
    throw error;
  }
};
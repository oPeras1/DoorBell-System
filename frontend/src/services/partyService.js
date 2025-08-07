import api from './api';

export const getParties = async () => {
  try {
    const response = await api.get('/party/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createParty = async (partyData) => {
  try {
    const response = await api.post('/party', partyData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteParty = async (partyId) => {
  try {
    await api.delete(`/party/${partyId}`);
  } catch (error) {
    throw error;
  }
};

export const getPartyById = async (partyId) => {
  try {
    const response = await api.get(`/party/${partyId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching party details:', error);
    throw error;
  }
};

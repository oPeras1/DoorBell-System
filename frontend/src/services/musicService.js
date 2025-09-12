import api from './api';

// Get all music
export const getAllMusic = async () => {
  try {
    const response = await api.get('/music/');
    return response.data;
  } catch (error) {
    console.error('Error fetching all music:', error);
    throw error;
  }
};

// Get music by ID
export const getMusicById = async (id) => {
  try {
    const response = await api.get(`/music/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching music by ID:', error);
    throw error;
  }
};

// Get music by user
export const getMusicByUser = async (userId) => {
  try {
    const response = await api.get(`/music/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching music by user:', error);
    throw error;
  }
};

// Search music by author
export const searchByAuthor = async (author) => {
  try {
    const response = await api.get('/music/search/author', {
      params: { author }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching music by author:', error);
    throw error;
  }
};

// Search music by name
export const searchByName = async (name) => {
  try {
    const response = await api.get('/music/search/name', {
      params: { name }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching music by name:', error);
    throw error;
  }
};

// Create new music
export const createMusic = async (musicData) => {
  try {
    const response = await api.post('/music/', {
      name: musicData.name,
      author: musicData.author,
      notes: musicData.notes,
      durations: musicData.durations,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating music:', error);
    throw error;
  }
};

// Update music
export const updateMusic = async (id, musicData) => {
  try {
    const response = await api.put(`/music/${id}`, {
      name: musicData.name,
      author: musicData.author,
      notes: musicData.notes,
      durations: musicData.durations,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating music:', error);
    throw error;
  }
};

// Delete music
export const deleteMusic = async (id) => {
  try {
    const response = await api.delete(`/music/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting music:', error);
    throw error;
  }
};
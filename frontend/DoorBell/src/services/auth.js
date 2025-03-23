import api from './api';

export const login = async (credentials) => {
  try {
    // Implementação real posterior
    const response = await api.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const checkAuthStatus = async () => {
  // Verificar token no AsyncStorage posteriormente
  return false;
};
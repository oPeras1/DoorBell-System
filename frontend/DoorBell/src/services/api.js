import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-api-endpoint.com/api/v1', // Alterar posteriormente
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
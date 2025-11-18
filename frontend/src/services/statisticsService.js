import api from './api';

export const getEnvironmentData = (hours = 24) => {
  return api.get(`/statistics/environment?hours=${hours}`);
};

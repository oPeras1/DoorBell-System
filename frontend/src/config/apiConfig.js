export const API_BASE_URL = 'http://192.168.3.224:8080';
export const API_TIMEOUT = 10000;

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register', 
  LOGOUT: '/auth/logout', 
  USER_ME: '/users/me',
  USERS: '/users/',
  DOOR: '/door',
  PARTIES: '/party/',
  CREATE_PARTY: '/party',
  DELETE_PARTY: '/party',
  UPDATE_GUEST_STATUS: '/party/',
  NOTIFICATIONS_UNREAD: '/notifications/unread',
  NOTIFICATIONS_ALL: '/notifications',
  NOTIFICATIONS_MARK_READ: '/notifications',
  NOTIFICATIONS_HAS_UNREAD: '/notifications/has-unread',
};
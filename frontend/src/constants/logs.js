export const LOG_TYPES = {
  REGISTRATION: {
    key: 'REGISTRATION',
    name: 'Registration',
    icon: 'person-add',
    color: '#10B981',
    bgColor: '#D1FAE5'
  },
  LOGIN: {
    key: 'LOGIN',
    name: 'Login',
    icon: 'log-in',
    color: '#3B82F6',
    bgColor: '#DBEAFE'
  },
  USER_MANAGEMENT: {
    key: 'USER_MANAGEMENT',
    name: 'User Management',
    icon: 'people',
    color: '#8B5CF6',
    bgColor: '#F3E8FF'
  },
  USER_STATUS: {
    key: 'USER_STATUS',
    name: 'User Status',
    icon: 'radio-button-on',
    color: '#06B6D4',
    bgColor: '#CFFAFE'
  },
  USER_DELETION: {
    key: 'USER_DELETION',
    name: 'User Deletion',
    icon: 'person-remove',
    color: '#EF4444',
    bgColor: '#FEE2E2'
  },
  PARTY_CREATED: {
    key: 'PARTY_CREATED',
    name: 'Party Created',
    icon: 'add-circle',
    color: '#10B981',
    bgColor: '#D1FAE5'
  },
  PARTY_DELETED: {
    key: 'PARTY_DELETED',
    name: 'Party Deleted',
    icon: 'trash',
    color: '#EF4444',
    bgColor: '#FEE2E2'
  },
  PARTY_STATUS_CHANGED: {
    key: 'PARTY_STATUS_CHANGED',
    name: 'Party Status Changed',
    icon: 'swap-horizontal',
    color: '#F59E0B',
    bgColor: '#FEF3C7'
  },
  GUEST_STATUS_CHANGED: {
    key: 'GUEST_STATUS_CHANGED',
    name: 'G. Status Changed',
    icon: 'people-circle',
    color: '#8B5CF6',
    bgColor: '#F3E8FF'
  },
  MAINTENANCE: {
    key: 'MAINTENANCE',
    name: 'Maintenance',
    icon: 'construct',
    color: '#6B7280',
    bgColor: '#F3F4F6'
  },
  REGISTRATION_MANAGEMENT: {
    key: 'REGISTRATION_MANAGEMENT',
    name: 'Registration Management',
    icon: 'lock-closed',
    color: '#EF4444',
    bgColor: '#FEE2E2'
  },
  PASSWORD_RESET: {
    key: 'PASSWORD_RESET',
    name: 'Password Reset',
    icon: 'key',
    color: '#F59E0B',
    bgColor: '#FEF3C7'
  },
  DOOR_OPEN: {
    key: 'DOOR_OPEN',
    name: 'Door Opened',
    icon: 'lock-open',
    color: '#10B981',
    bgColor: '#D1FAE5'
  },
  DOOR_OPEN_FAILED: {
    key: 'DOOR_OPEN_FAILED',
    name: 'Door Open Failed',
    icon: 'warning',
    color: '#F59E0B',
    bgColor: '#FEF3C7'
  },
  DOOR_OPEN_ERROR: {
    key: 'DOOR_OPEN_ERROR',
    name: 'Door Open Error',
    icon: 'alert-circle',
    color: '#EF4444',
    bgColor: '#FEE2E2'
  },
  INFO: {
    key: 'INFO',
    name: 'Information',
    icon: 'information-circle',
    color: '#3B82F6',
    bgColor: '#DBEAFE'
  }
};

export const getLogTypeConfig = (logType) => {
  return LOG_TYPES[logType] || LOG_TYPES.INFO;
};

export const LOG_TYPE_OPTIONS = Object.values(LOG_TYPES);

export const DATE_FILTER_OPTIONS = [
  { key: 'all', name: 'All Time' },
  { key: 'today', name: 'Today' },
  { key: 'yesterday', name: 'Yesterday' },
  { key: 'last7days', name: 'Last 7 Days' },
  { key: 'last30days', name: 'Last 30 Days' },
  { key: 'custom', name: 'Custom Range' }
];

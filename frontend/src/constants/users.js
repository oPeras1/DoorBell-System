export const USER_TYPE_INFO = {
  KNOWLEDGER: {
    icon: 'shield-checkmark',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    borderColor: '#A855F7',
    title: 'Knowledger',
    subtitle: 'Full Access',
    priority: 1,
    gradient: ['#8B5CF6', '#7C3AED'],
    description: 'Complete system control',
    cardBg: '#f5f3ff',
  },
  HOUSER: {
    icon: 'home',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#10B981',
    title: 'Houser',
    subtitle: 'Resident Access',
    priority: 2,
    gradient: ['#10B981', '#059669'],
    description: 'Home management access',
    cardBg: '#e6fcf5',
  },
  GUEST: {
    icon: 'person-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    title: 'Guest',
    subtitle: 'Limited Access',
    priority: 3,
    gradient: ['#9CA3AF', '#6B7280'],
    description: 'Basic visitor access',
    cardBg: '#f3f4f6',
  }
};

export const CONNECTION_MODES = {
  ONLINE: {
    icon: 'wifi',
    color: '#22C55E',
    bgColor: '#DCFCE7',
    title: 'Online',
    subtitle: 'Available for all interactions'
  },
  DONT_DISTURB: {
    icon: 'moon',
    color: '#EF4444',
    bgColor: '#FEE2E2',
    title: 'Do Not Disturb',
    subtitle: 'Only urgent notifications'
  }
};

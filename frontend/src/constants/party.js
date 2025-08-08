export const PARTY_TYPE_CONFIG = {
  HOUSE_PARTY: { 
    icon: 'home', 
    color: '#8B5CF6', 
    bgColor: '#F3E8FF', 
    gradient: ['#8B5CF6', '#A855F7'],
    name: 'House Party' 
  },
  KNOWLEDGE_SHARING: { 
    icon: 'school', 
    color: '#3B82F6', 
    bgColor: '#DBEAFE', 
    gradient: ['#3B82F6', '#2563EB'],
    name: 'Knowledge Sharing' 
  },
  GAME_NIGHT: { 
    icon: 'game-controller', 
    color: '#10B981', 
    bgColor: '#D1FAE5', 
    gradient: ['#10B981', '#059669'],
    name: 'Game Night' 
  },
  MOVIE_NIGHT: { 
    icon: 'film', 
    color: '#F59E0B', 
    bgColor: '#FEF3C7', 
    gradient: ['#F59E0B', '#D97706'],
    name: 'Movie Night' 
  },
  DINNER: { 
    icon: 'restaurant', 
    color: '#EF4444', 
    bgColor: '#FEE2E2', 
    gradient: ['#EF4444', '#DC2626'],
    name: 'Dinner' 
  },
  CLEANING: { 
    icon: 'trash', 
    color: '#6B7280', 
    bgColor: '#F3F4F6', 
    gradient: ['#6B7280', '#4B5563'],
    name: 'Cleaning' 
  }
};

export const ROOMS = [
  { key: 'WC1', label: 'WC 1', icon: 'water', color: '#06B6D4' },
  { key: 'WC2', label: 'WC 2', icon: 'water', color: '#0891B2' },
  { key: 'KITCHEN', label: 'Kitchen', icon: 'restaurant-outline', color: '#F59E0B' },
  { key: 'LIVING_ROOM', label: 'Living Room', icon: 'tv', color: '#8B5CF6' },
  { key: 'HUGO_B', label: "Hugo's Room", icon: 'bed', color: '#EF4444' },
  { key: 'LEO_B', label: "Leo's Room", icon: 'bed', color: '#10B981' },
  { key: 'VIC_B', label: "Vic's Room", icon: 'bed', color: '#F97316' },
  { key: 'FILIPE_B', label: "Filipe's Room", icon: 'bed', color: '#6366F1' },
  { key: 'GUI_B', label: "Guilherme's Room", icon: 'bed', color: '#3B82F6' },
  { key: 'BALCONY', label: 'Balcony', icon: 'flower', color: '#84CC16' }
];

export const ROOM_CONFIG = {
  WC1: { icon: 'water', name: 'WC 1', color: '#06B6D4' },
  WC2: { icon: 'water', name: 'WC 2', color: '#0891B2' },
  KITCHEN: { icon: 'restaurant-outline', name: 'Kitchen', color: '#F59E0B' },
  LIVING_ROOM: { icon: 'tv', name: 'Living Room', color: '#8B5CF6' },
  HUGO_B: { icon: 'bed', name: "Hugo's Room", color: '#EF4444' },
  LEO_B: { icon: 'bed', name: "Leo's Room", color: '#10B981' },
  VIC_B: { icon: 'bed', name: "Vic's Room", color: '#F97316' },
  FILIPE_B: { icon: 'bed', name: "Filipe's Room", color: '#6366F1' },
  GUI_B: { icon: 'bed', name: "Guilherme's Room", color: '#3B82F6' },
  BALCONY: { icon: 'flower', name: 'Balcony', color: '#84CC16' }
};

export const STATUS_CONFIG = {
  SCHEDULED: { icon: 'time', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'], name: 'Scheduled' },
  IN_PROGRESS: { icon: 'play-circle', color: '#10B981', gradient: ['#10B981', '#059669'], name: 'In Progress' },
  COMPLETED: { icon: 'checkmark-circle', color: '#6B7280', gradient: ['#6B7280', '#4B5563'], name: 'Completed' },
  CANCELLED: { icon: 'close-circle', color: '#EF4444', gradient: ['#EF4444', '#DC2626'], name: 'Cancelled' }
};

export const GUEST_STATUS_CONFIG = {
  GOING: { icon: 'checkmark-circle', color: '#10B981', gradient: ['#10B981', '#059669'], name: 'Going' },
  NOT_GOING: { icon: 'close-circle', color: '#EF4444', gradient: ['#EF4444', '#DC2626'], name: 'Not Going' },
  UNDECIDED: { icon: 'help-circle', color: '#6B7280', gradient: ['#6B7280', '#4B5563'], name: 'Undecided' }
};

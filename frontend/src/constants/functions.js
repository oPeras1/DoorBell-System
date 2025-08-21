// Funções de tempo e assets
export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return 'Good Morning';
  } else if (hour >= 12 && hour < 18) {
    return 'Good Afternoon';
  } else {
    return 'Good Evening';
  }
};

export const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon';
  } else if (hour >= 18 && hour < 21) {
    return 'evening';
  } else {
    return 'night';
  }
};

export const getTimeOfDayImage = () => {
  const timeOfDay = getTimeOfDay();
  switch (timeOfDay) {
    case 'night':
      return require('../../assets/City/night.png');
    case 'morning':
      return require('../../assets/City/morning.png');
    case 'afternoon':
      return require('../../assets/City/afternoon.png');
    case 'evening':
      return require('../../assets/City/evening.png');
    default:
      return require('../../assets/City/morning.png');
  }
};

export const getAvatarSource = (userType) => {
  if (userType === 'KNOWLEDGER') {
    return require('../../assets/Avatar/avatarknowledger.jpg');
  }
  if (userType === 'HOUSER') {
    return require('../../assets/Avatar/avatarhouser.png');
  }
  return require('../../assets/Avatar/avatarguest.jpeg');
};

export const getTimeBasedIcon = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'sunny-outline';
  if (hour >= 12 && hour < 18) return 'partly-sunny-outline';
  return 'moon-outline';
};

export const getTimeBasedColor = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return '#F59E0B';
  if (hour >= 12 && hour < 18) return '#EF4444';
  return '#6366F1';
};

export const getLocalDate = (date) => {
  const d = date ? new Date(date) : new Date();
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    0,
    0
  );
};

export const formatLocalISOString = (date) => {
  // YYYY-MM-DDTHH:mm:ss (local time, no Z)
  const pad = (n) => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds())
  );
};
import { colors } from './colors';

export const notificationTypes = {
  DOORBELL: {
    icon: '🔔',
    color: colors.primary,
    bgColor: colors.primaryLight,
    title: 'Doorbell'
  },
  VISITOR: {
    icon: '👤',
    color: colors.accent,
    bgColor: colors.accentLight,
    title: 'Visitor'
  },
  PARTY: {
    icon: '🎉',
    color: colors.success,
    bgColor: colors.successLight,
    title: 'Event'
  },
  SECURITY: {
    icon: '🛡️',
    color: colors.warning,
    bgColor: colors.warningLight,
    title: 'Security'
  },
  SYSTEM: {
    icon: '⚙️',
    color: colors.info,
    bgColor: colors.infoLight,
    title: 'System'
  }
};

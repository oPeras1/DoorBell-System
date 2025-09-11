import { colors } from './colors';

export const notificationTypes = {
  DOORBELL: {
    icon: 'notifications',
    color: colors.primary,
    bgColor: colors.primaryLight,
    title: 'Doorbell'
  },
  VISITOR: {
    icon: 'person',
    color: colors.accent,
    bgColor: colors.accentLight,
    title: 'Visitor'
  },
  PARTY: {
    icon: 'balloon',
    color: colors.success,
    bgColor: colors.successLight,
    title: 'Event'
  },
  SECURITY: {
    icon: 'shield-checkmark',
    color: colors.warning,
    bgColor: colors.warningLight,
    title: 'Security'
  },
  SYSTEM: {
    icon: 'settings',
    color: colors.info,
    bgColor: colors.infoLight,
    title: 'System'
  }
};

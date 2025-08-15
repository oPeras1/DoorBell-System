import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Animated,
  Platform,
  Easing,
  Dimensions,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';
import { USER_TYPE_INFO, CONNECTION_MODES } from '../constants/users';
import { hasUnreadNotifications } from '../services/notificationService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const isSmallScreen = SCREEN_WIDTH < 370;

const getAvatarSource = (userType) => {
  if (userType === 'KNOWLEDGER') {
    return require('../../assets/Avatar/avatarknowledger.jpg');
  }
  if (userType === 'HOUSER') {
    return require('../../assets/Avatar/avatarhouser.png');
  }
  return require('../../assets/Avatar/avatarguest.jpeg');
};

const TopField = ({ 
  greeting, 
  userName, 
  userType = 'GUEST',
  showDarkModeToggle = true,
  onLogout,
  navigation
}) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState('ONLINE');
  const [dropdownAnimation] = useState(new Animated.Value(0));
  const [hasUnreadNotificationsState, setHasUnreadNotificationsState] = useState(false);
  const notificationDotScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let intervalId;
    const fetchUnread = () => {
      hasUnreadNotifications()
        .then(setHasUnreadNotificationsState)
        .catch(() => setHasUnreadNotificationsState(false));
    };
    fetchUnread();
    intervalId = setInterval(fetchUnread, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (hasUnreadNotificationsState) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(notificationDotScale, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(notificationDotScale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      notificationDotScale.setValue(1);
    }
  }, [hasUnreadNotificationsState]);

  const toggleDropdown = () => {
    if (dropdownVisible) {
      // Close animation
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 250,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }).start(() => setDropdownVisible(false));
    } else {
      setDropdownVisible(true);
      // Open animation
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 300,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: false,
      }).start();
    }
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    toggleDropdown();
  };

  const handleLogout = () => {
    toggleDropdown();
    if (onLogout) {
      onLogout();
    }
  };

  const handleNotificationsPress = () => {
    if (navigation) {
      navigation.navigate('Notifications', { notificationsPollingInterval: 30000 });
    }
  };

  const getTimeBasedIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'sunny-outline';
    if (hour >= 12 && hour < 18) return 'partly-sunny-outline';
    return 'moon-outline';
  };

  const getTimeBasedColor = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '#F59E0B'; // Morning - Golden
    if (hour >= 12 && hour < 18) return '#EF4444'; // Afternoon - Red
    return '#6366F1'; // Evening - Purple
  };

  const getUserTypeInfo = () => USER_TYPE_INFO[userType] || USER_TYPE_INFO.GUEST;
  const getCurrentModeInfo = () => CONNECTION_MODES[selectedMode] || CONNECTION_MODES.ONLINE;

  return (
    <>
      <View style={[
        styles.topField,
        isSmallScreen && styles.topFieldSmall,
      ]}>
        {/* Background gradient effect */}
        <View style={styles.backgroundGradient} />
        {/* Decorative elements */}
        <View style={[styles.decorativeCircle1, { backgroundColor: `${getTimeBasedColor()}10` }]} />
        <View style={[styles.decorativeCircle2, { backgroundColor: `${colors.primary}08` }]} />
        <View style={[
          styles.contentContainer,
          isSmallScreen && styles.contentContainerSmall
        ]}>
          {/* Left Section - Greeting */}
          <View style={[
            styles.leftSection,
            isSmallScreen && styles.leftSectionSmall
          ]}>
            <View style={styles.greetingContainer}>
              <View style={styles.greetingRow}>
                <Ionicons 
                  name={getTimeBasedIcon()} 
                  size={18} 
                  color={getTimeBasedColor()} 
                  style={styles.timeIcon}
                />
                <Text style={[styles.greetingText, { color: getTimeBasedColor() }]}>
                  {greeting}
                </Text>
                <View style={[styles.greetingAccent, { backgroundColor: getTimeBasedColor() }]} />
              </View>
              {userName && (
                <View style={styles.userNameContainer}>
                  <Text style={styles.userNameText} numberOfLines={1}>
                    {userName}
                  </Text>
                  <Text style={styles.separatorDot}>•</Text>
                  <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeInfo().bgColor }]}>
                    <Ionicons name={getUserTypeInfo().icon} size={10} color={getUserTypeInfo().color} />
                    <Text style={[styles.userTypeBadgeText, { color: getUserTypeInfo().color }]}>
                      {getUserTypeInfo().title}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          {/* Right Section - Controls */}
          <View style={styles.rightSection}>
            {/* Controls Capsule */}
            <View style={[
              styles.controlsCapsule,
              isSmallScreen && styles.controlsCapsuleSmall
            ]}>
              {/* Dark Mode Toggle */}
              {showDarkModeToggle && (
                  <TouchableOpacity style={[
                    styles.actionButton,
                    isSmallScreen && styles.actionButtonSmall
                  ]} activeOpacity={0.7}>
                    <Ionicons name="moon-outline" size={isSmallScreen ? 16 : 22} color={colors.textSecondary} />
                  </TouchableOpacity>
              )}

              {/* Notification Bell Icon */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isSmallScreen && styles.actionButtonSmall
                ]}
                activeOpacity={0.7}
                onPress={handleNotificationsPress}
              >
                <Ionicons name="notifications-outline" size={isSmallScreen ? 16 : 22} color={colors.textSecondary} />
                {hasUnreadNotificationsState && (
                  <Animated.View
                    style={[
                      styles.notificationDot,
                      { transform: [{ scale: notificationDotScale }] }
                    ]}
                  />
                )}
              </TouchableOpacity>
              
              {/* User Profile */}
              <TouchableOpacity 
                style={styles.profileContainer} 
                onPress={toggleDropdown}
                activeOpacity={0.8}
              >
                <View style={styles.profileAvatarGlow} />
                <Image 
                  source={getAvatarSource(userType)}
                  style={[
                    styles.profileImage,
                    isSmallScreen && styles.profileImageSmall
                  ]}
                  resizeMode="cover"
                />
                <View style={styles.profileAvatarBorder} />
                <View style={[
                  styles.profileStatusDot,
                  isSmallScreen && styles.profileStatusDotSmall,
                  { backgroundColor: getCurrentModeInfo().color }
                ]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="none"
        onRequestClose={toggleDropdown}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleDropdown}>
          <Animated.View style={[
            styles.dropdownContainer,
            Platform.OS === 'web' && styles.dropdownContainerWeb,
            {
              opacity: dropdownAnimation,
              transform: [{
                translateY: dropdownAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
              }, {
                scale: dropdownAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                })
              }]
            }
          ]}>
            {/* Header */}
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>User Status</Text>
              <TouchableOpacity onPress={toggleDropdown} style={styles.closeButton}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Connection Modes */}
            <View style={styles.modesContainer}>
              {Object.entries(CONNECTION_MODES).map(([key, mode]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.modeItem,
                    selectedMode === key && styles.selectedModeItem
                  ]}
                  onPress={() => handleModeSelect(key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.modeIconContainer, { backgroundColor: mode.bgColor }]}>
                    <Ionicons name={mode.icon} size={18} color={mode.color} />
                  </View>
                  <View style={styles.modeContent}>
                    <Text style={[styles.modeTitle, { color: mode.color }]}>{mode.title}</Text>
                    <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
                  </View>
                  {selectedMode === key && (
                    <Ionicons name="checkmark-circle" size={20} color={mode.color} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {/* Divider */}
            <View style={styles.dropdownDivider} />

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out-outline" size={18} color={colors.danger} />
              </View>
              <Text style={styles.logoutText}>Logout</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.danger} />
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  topField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingTop: 10,
    paddingBottom: 10,
    zIndex: 1000,
    // Shadow styles
    ...(Platform.OS === 'ios' ? {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    } : Platform.OS === 'web' ? {
      boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
      borderBottom: `2px solid ${colors.border}`,
    } : {
      elevation: 8,
    }),
  },
  topFieldSmall: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${colors.primary}02`,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.small,
    zIndex: 1,
    minHeight: 50,
  },
  contentContainerSmall: {
    paddingHorizontal: spacing.small,
    paddingVertical: 2,
    minHeight: 36,
  },
  leftSection: {
    flex: 1,
    marginRight: spacing.medium,
  },
  leftSectionSmall: {
    marginRight: spacing.small,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeIcon: {
    marginRight: 8,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  greetingAccent: {
    width: 20,
    height: 3,
    borderRadius: 2,
    marginLeft: 8,
    opacity: 0.8,
  },
  userNameText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    flexShrink: 0,
  },
  separatorDot: {
    fontSize: 14,
    color: colors.textSecondary,
    marginHorizontal: 6,
    opacity: 0.6,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  userTypeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
    letterSpacing: 0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.textSecondary}10`,
    borderRadius: 30,
    paddingHorizontal: spacing.small,
    paddingVertical: 5,
    gap: spacing.small,
  },
  controlsCapsuleSmall: {
    borderRadius: 18,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionButtonSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  profileContainer: {
    position: 'relative',
  },
  profileAvatarGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: `${colors.primary}20`,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 0,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 1,
  },
  profileImageSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  profileAvatarBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.6,
    zIndex: 2,
  },
  profileStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 3,
  },
  profileStatusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'flex-end',
    paddingTop: Platform.OS === 'android' ? 80 : 95,
    paddingRight: spacing.large,
  },
  dropdownContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownContainerWeb: {
    position: 'absolute',
    top: 100, 
    right: 520, 
    zIndex: 1001,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: `${colors.primary}05`,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modesContainer: {
    paddingVertical: spacing.small,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: 0,
  },
  selectedModeItem: {
    backgroundColor: `${colors.primary}08`,
  },
  modeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    backgroundColor: `${colors.danger}08`,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.danger}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    zIndex: 2,
    borderWidth: 2,
    borderColor: colors.card,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});

export default TopField;
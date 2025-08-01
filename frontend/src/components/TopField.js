import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Animated,
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';

const USER_TYPE_INFO = {
  KNOWLEDGER: {
    icon: 'shield-checkmark',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    title: 'Knowledger',
  },
  HOUSER: {
    icon: 'home',
    color: '#059669',
    bgColor: '#ECFDF5',
    title: 'Houser',
  },
  GUEST: {
    icon: 'person-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    title: 'Guest',
  }
};

const TopField = ({ 
  greeting, 
  userName, 
  userAvatar, 
  userType = 'GUEST',
  isOnline = true, 
  onProfilePress, 
  showDarkModeToggle = true 
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();

    // Pulse animation for online indicator
    if (isOnline) {
      const createPulse = () => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.4,
              duration: 1500,
              useNativeDriver: false,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: false,
            }),
          ])
        ).start();
      };
      createPulse();
    }
  }, [isOnline]);

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

  return (
    <Animated.View style={[
      styles.topField,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Decorative elements */}
      <View style={[styles.decorativeCircle1, { backgroundColor: `${getTimeBasedColor()}10` }]} />
      <View style={[styles.decorativeCircle2, { backgroundColor: `${colors.primary}08` }]} />
      
      <View style={styles.contentContainer}>
        {/* Left Section - Greeting */}
        <View style={styles.leftSection}>
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
          {/* Door Status */}
          <View style={styles.doorStatusContainer}>
            <Ionicons name="home" size={24} color={colors.primary} />
            <Animated.View style={[
              styles.statusIndicator,
              {
                backgroundColor: isOnline ? '#22C55E' : '#EF4444',
                transform: [{ scale: isOnline ? pulseAnim : 1 }]
              }
            ]} />
          </View>

          {/* Dark Mode Toggle (placeholder) */}
          {showDarkModeToggle && (
            <TouchableOpacity style={styles.darkModeButton} activeOpacity={0.7}>
              <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* User Profile */}
          <TouchableOpacity 
            style={styles.profileContainer} 
            onPress={onProfilePress}
            activeOpacity={0.8}
          >
            <View style={styles.profileImageContainer}>
              <Image 
                source={userAvatar || require('../../assets/avatar.png')} 
                style={styles.profileImage}
                resizeMode="cover"
              />
              <View style={[
                styles.profileStatusDot,
                { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }
              ]} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  topField: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    paddingTop: Platform.OS === 'android' ? 15 : 30,
    paddingBottom: 10,
    zIndex: 1000,
    // Shadow styles
    ...(Platform.OS === 'ios' ? {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    } : {
      elevation: 8,
    }),
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
  leftSection: {
    flex: 1,
    marginRight: spacing.medium,
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
    gap: spacing.large,
  },
  doorStatusContainer: {
    width: 44,
    height: 44,
    backgroundColor: `${colors.primary}15`,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.card,
  },
  darkModeButton: {
    width: 40,
    height: 40,
    backgroundColor: `${colors.textSecondary}10`,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    position: 'relative',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.card,
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
  },
});

export default TopField;

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Animated,
  Platform,
  Easing,
  Dimensions
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const isSmallScreen = SCREEN_WIDTH < 370;

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
  const [glowOpacity] = useState(new Animated.Value(0));
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

    // Suave animação de brilho para online indicator
    if (isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(glowOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: false,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0,
              duration: 400,
              useNativeDriver: false,
            }),
          ]),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      glowOpacity.setValue(0);
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
      isSmallScreen && styles.topFieldSmall,
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
            {/* Service Status */}
            <TouchableOpacity style={[
              styles.actionButton,
              isSmallScreen && styles.actionButtonSmall
            ]} activeOpacity={0.7}>
              <Ionicons 
                name="lock-closed-outline"
                size={isSmallScreen ? 18 : 24}
                color={isOnline ? '#22C55E' : '#EF4444'} 
              />
              {isOnline && (
                <Animated.View style={[
                  styles.onlineGlow,
                  isSmallScreen && styles.onlineGlowSmall,
                  { 
                    transform: [{ scale: pulseAnim }],
                    opacity: glowOpacity
                  }
                ]} />
              )}
            </TouchableOpacity>
            {/* Dark Mode Toggle */}
            {showDarkModeToggle && (
              <TouchableOpacity style={[
                styles.actionButton,
                isSmallScreen && styles.actionButtonSmall
              ]} activeOpacity={0.7}>
                <Ionicons name="moon-outline" size={isSmallScreen ? 16 : 22} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {/* User Profile */}
            <TouchableOpacity 
              style={styles.profileContainer} 
              onPress={onProfilePress}
              activeOpacity={0.8}
            >
              <Image 
                source={userAvatar || require('../../assets/avatar.png')} 
                style={[
                  styles.profileImage,
                  isSmallScreen && styles.profileImageSmall
                ]}
                resizeMode="cover"
              />
              <View style={[
                styles.profileStatusDot,
                isSmallScreen && styles.profileStatusDotSmall,
                { backgroundColor: isOnline ? '#22C55E' : '#EF4444' }
              ]} />
            </TouchableOpacity>
          </View>
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
    paddingTop: 10,
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
  onlineGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    zIndex: -1,
  },
  onlineGlowSmall: {
    borderRadius: 14,
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.card,
  },
  profileImageSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
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
  profileStatusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
});

export default TopField;

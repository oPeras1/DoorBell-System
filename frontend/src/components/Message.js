import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';

const AUTO_CLOSE_MS = 5000;
const SCREEN_WIDTH = Dimensions.get('window').width;
const isWeb = Platform.OS === 'web';

const ICONS = {
  error: { name: 'alert-circle', color: 'white', bg: colors.danger },
  success: { name: 'checkmark-circle', color: 'white', bg: colors.success },
};

const Message = ({ message, onDismiss, type = 'error', style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef(null);
  const isMounted = useRef(true);

  // Calculate dynamic width based on current screen width
  const iconProps = ICONS[type] || ICONS.error;

  useEffect(() => {
    isMounted.current = true;

    if (message) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: false,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: false,
        }),
      ]).start();

      timerRef.current = setTimeout(() => {
        if (isMounted.current) handleClose();
      }, AUTO_CLOSE_MS);
    }

    return () => {
      isMounted.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (onDismiss && isMounted.current) onDismiss();
    });
  };

  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: iconProps.bg,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          shadowOpacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.15],
          }),
        },
        style,
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.iconContainer}>
        <Ionicons name={iconProps.name} size={24} color={iconProps.color} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={20} color="white" />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xlarge,
    zIndex: 100,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    ...(Platform.OS === 'ios' ? {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    } : Platform.OS === 'android' ? {
      elevation: 8,
      shadowColor: 'transparent',
    } : {}),
    ...(isWeb ? {
      alignSelf: 'center',
      width: 400,
      marginLeft: 'auto',
      marginRight: 'auto',
      left: 0,
      right: 0,
    } : {
      left: spacing.large,
      right: spacing.large,
    }),
    maxWidth: isWeb ? 400 : '100%',
  },
  iconContainer: {
    marginRight: spacing.small,
    flexShrink: 0,
  },
  message: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
    ...(isWeb && {
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      hyphens: 'auto',
    }),
  },
  closeButton: {
    padding: spacing.small,
    marginLeft: spacing.small,
    flexShrink: 0,
  }
});

export default Message;
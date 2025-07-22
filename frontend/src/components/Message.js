import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';

const AUTO_CLOSE_MS = 5000;
const SCREEN_WIDTH = Dimensions.get('window').width;

const ICONS = {
  error: { name: 'alert-circle', color: 'white', bg: colors.danger },
  success: { name: 'checkmark-circle', color: 'white', bg: colors.success },
};

const Message = ({ message, onDismiss, type = 'error', style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const timerRef = useRef(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (message) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 7,
          tension: 60,
          useNativeDriver: true,
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
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss && isMounted.current) onDismiss();
    });
  };

  if (!message) return null;

  const iconProps = ICONS[type] || ICONS.error;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: iconProps.bg },
        style,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          shadowOpacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.15],
          }),
        },
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
    left: spacing.large,
    right: spacing.large,
    zIndex: 100,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    width: SCREEN_WIDTH - 2 * spacing.large,
  },
  iconContainer: {
    marginRight: spacing.small,
  },
  message: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  closeButton: {
    padding: spacing.small,
    marginLeft: spacing.small,
  }
});

export default Message;
import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Animated,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors'; // Alteração para importar o hook
import { spacing, borderRadius } from '../constants/styles';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PopUp = ({ 
  visible, 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  showCancel = true 
}) => {
  const colors = useColors();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const typeConfig = {
    warning: {
      icon: 'warning',
      iconColor: colors.warning,
      iconBg: colors.accentLight,
    },
    danger: {
      icon: 'alert-circle',
      iconColor: colors.danger,
      iconBg: colors.accentLight,
    },
    info: {
      icon: 'information-circle',
      iconColor: colors.info,
      iconBg: colors.accentLight,
    },
    success: {
      icon: 'checkmark-circle',
      iconColor: colors.success,
      iconBg: colors.accentLight,
    }
  };

  const config = typeConfig[type] || typeConfig.warning;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 100,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [visible]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

 
  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.large,
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.large,
      padding: spacing.large,
      width: Math.min(SCREEN_WIDTH - 40, 320),
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    iconContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.medium,
      backgroundColor: config.iconBg,
    },
    content: {
      alignItems: 'center',
      marginBottom: spacing.large,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.small,
    },
    message: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.medium,
      width: '100%',
    },
    button: {
      flex: 1,
      paddingVertical: spacing.medium,
      paddingHorizontal: spacing.large,
      borderRadius: borderRadius.medium,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    confirmButton: {
      backgroundColor: type === 'danger' ? colors.danger : colors.primary,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontWeight: '600',
      fontSize: 16,
    },
    confirmButtonText: {
      color: '#FFF',
      fontWeight: '600',
      fontSize: 16,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={config.icon} size={32} color={config.iconColor} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {showCancel && (
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.confirmButton,
              ]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default PopUp;
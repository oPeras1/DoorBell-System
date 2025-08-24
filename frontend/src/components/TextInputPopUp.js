import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  Animated,
  Platform,
  Dimensions,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { spacing, borderRadius } from '../constants/styles';

const SCREEN_WIDTH = Dimensions.get('window').width;

const TextInputPopUp = ({ 
  visible, 
  title, 
  message, 
  placeholder = 'Enter text...',
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  value,
  onChangeText,
  multiline = true,
  numberOfLines = 3,
  type = 'info' // 'warning', 'danger', 'info', 'success'
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

  const config = typeConfig[type] || typeConfig.info;

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
      width: Math.min(SCREEN_WIDTH - 40, 350),
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
      width: '100%',
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
      marginBottom: spacing.medium,
    },
    textInput: {
      width: '100%',
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: borderRadius.medium,
      padding: spacing.medium,
      fontSize: 14,
      color: colors.textPrimary,
      minHeight: multiline ? 80 : 40,
      textAlignVertical: multiline ? 'top' : 'center',
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
            
            {/* Text Input */}
            <TextInput
              style={styles.textInput}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              value={value}
              onChangeText={onChangeText}
              multiline={multiline}
              numberOfLines={numberOfLines}
              textAlignVertical={multiline ? 'top' : 'center'}
            />
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
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

export default TextInputPopUp;

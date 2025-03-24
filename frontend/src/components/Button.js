import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false,
  disabled = false,
  fullWidth = true,
  iconLeft,
  iconRight
}) => {
  const getButtonStyle = () => {
    switch(variant) {
      case 'secondary':
        return styles.buttonSecondary;
      case 'outline':
        return styles.buttonOutline;
      case 'danger':
        return styles.buttonDanger;
      default:
        return styles.buttonPrimary;
    }
  };

  const getTextStyle = () => {
    switch(variant) {
      case 'outline':
        return styles.textOutline;
      default:
        return styles.buttonText;
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.button, 
        getButtonStyle(), 
        fullWidth && styles.fullWidth,
        disabled && styles.buttonDisabled
      ]} 
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : 'white'} />
      ) : (
        <View style={styles.buttonContent}>
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <Text style={[getTextStyle(), disabled && styles.textDisabled]}>{title}</Text>
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: spacing.medium,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.small,
    height: 56,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0,
    elevation: 0,
  },
  fullWidth: {
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  textOutline: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  textDisabled: {
    color: colors.textSecondary,
  },
  iconLeft: {
    marginRight: spacing.small,
  },
  iconRight: {
    marginLeft: spacing.small,
  }
});

export default Button;
import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Adicionar import para ícones
import { spacing, borderRadius } from '../constants/styles';
import { useColors } from '../hooks/useColors';

const InputField = ({ 
  label,
  placeholder, 
  value, 
  onChangeText, 
  secureTextEntry = false, 
  icon, 
  error, 
  autoCapitalize = 'none',
  keyboardType = 'default',
  onBlur,
  editable = true,
  showClearButton = false,
  onClear,
  containerStyle
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!secureTextEntry);
  const [focusAnim] = useState(new Animated.Value(0));
  const colors = useColors();
  const styles = getStyles(colors);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (onBlur) onBlur();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary]
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View style={[
        styles.inputContainer, 
        containerStyle,
        { borderColor },
        error && styles.inputError,
        !editable && styles.inputDisabled
      ]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        
        <TextInput
          style={[
            styles.input,
            // Remove o contorno azul do navegador apenas no web e quando focado
            Platform.OS === 'web' && isFocused ? { outline: 'none' } : null
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          editable={editable}
        />
        
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.visibilityToggle} 
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Text style={styles.visibilityText}>
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
        
        {showClearButton && value && value.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={onClear}
          >
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    marginBottom: spacing.medium,
    width: '100%',
  },
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.small,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    borderWidth: 1.5,
    paddingHorizontal: spacing.medium,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: spacing.medium,
    outline: 'none',
    outlineWidth: 0,
  },
  iconContainer: {
    marginRight: spacing.small,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    opacity: 0.7,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  visibilityToggle: {
    padding: spacing.small,
  },
  visibilityText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  clearButton: {
    padding: spacing.small,
  },
});

export default InputField;
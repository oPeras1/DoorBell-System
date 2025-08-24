import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Animated, View, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';

const Switch = ({ 
  value = false, 
  onValueChange, 
  disabled = false,
  size = 'medium', // 'small', 'medium', 'large'
  activeColor,
  inactiveColor,
  thumbColor,
  style
}) => {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(value ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          width: 40,
          height: 22,
          thumbSize: 18,
          padding: 2,
        };
      case 'large':
        return {
          width: 60,
          height: 32,
          thumbSize: 28,
          padding: 2,
        };
      default: // medium
        return {
          width: 50,
          height: 28,
          thumbSize: 24,
          padding: 2,
        };
    }
  };

  const sizeConfig = getSizeConfig();
  const translateXValue = sizeConfig.width - sizeConfig.thumbSize - sizeConfig.padding * 2;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value, translateX]);

  const handlePress = () => {
    if (disabled || !onValueChange) return;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onValueChange(!value);
  };

  const getTrackColor = () => {
    if (disabled) return colors.disabled;
    if (value) return activeColor || colors.primary;
    return inactiveColor || colors.border;
  };

  const getThumbColor = () => {
    if (disabled) return colors.textSecondary;
    if (thumbColor) return thumbColor;
    return value ? '#FFFFFF' : colors.textSecondary;
  };

  const styles = StyleSheet.create({
    container: {
      width: sizeConfig.width,
      height: sizeConfig.height,
      borderRadius: sizeConfig.height / 2,
      padding: sizeConfig.padding,
      justifyContent: 'center',
      backgroundColor: getTrackColor(),
      opacity: disabled ? 0.6 : 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    thumb: {
      width: sizeConfig.thumbSize,
      height: sizeConfig.thumbSize,
      borderRadius: sizeConfig.thumbSize / 2,
      backgroundColor: getThumbColor(),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    }
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            transform: [
              {
                translateX: translateX.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, translateXValue],
                }),
              },
              { scale: scaleAnim }
            ],
          },
        ]}
      />
    </TouchableOpacity>
  );
};

export default Switch;
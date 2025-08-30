import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { getLogTypeConfig } from '../constants/logs';
import { spacing, borderRadius } from '../constants/styles';

const LogItem = ({ log }) => {
  const colors = useColors();
  const logConfig = getLogTypeConfig(log.logType);
  const [isExpanded, setIsExpanded] = useState(false);
  const [animatedHeight] = useState(new Animated.Value(0));
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    }
  };

  const formatFullDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  // Check if message is potentially truncated (rough estimation)
  const isLongMessage = log.message.length > 80;

  return (
    <TouchableOpacity 
      style={styles.container(colors, isExpanded)} 
      onPress={toggleExpanded}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.iconContainer, { backgroundColor: logConfig.bgColor }]}>
          <Ionicons name={logConfig.icon} size={20} color={logConfig.color} />
        </View>
        <View style={styles.contentContainer}>
          <Text 
            style={styles.message(colors)} 
            numberOfLines={isExpanded ? undefined : 2}
          >
            {log.message}
          </Text>
          <View style={styles.metaContainer}>
            <Text style={styles.username(colors)}>by {log.username}</Text>
            <Text style={styles.separator(colors)}>•</Text>
            <Text style={styles.timestamp(colors)}>{formatDate(log.timestamp)}</Text>
            {isLongMessage && (
              <>
                <Text style={styles.separator(colors)}>•</Text>
                <Text style={styles.expandHint(colors)}>
                  {isExpanded ? 'tap to collapse' : 'tap to expand'}
                </Text>
              </>
            )}
          </View>
          <Text style={styles.fullDate(colors)}>{formatFullDate(log.timestamp)}</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <View style={[styles.typeChip, { backgroundColor: logConfig.bgColor }]}>
          <Text style={[styles.typeText, { color: logConfig.color }]}>
            {logConfig.name}
          </Text>
        </View>
        {isLongMessage && (
          <View style={styles.expandIcon}>
            <Animated.View
              style={{
                transform: [{
                  rotate: animatedHeight.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg'],
                  })
                }]
              }}
            >
              <Ionicons 
                name="chevron-down" 
                size={16} 
                color={colors.textSecondary} 
              />
            </Animated.View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  container: (colors, isExpanded) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginBottom: spacing.small,
    borderWidth: isExpanded ? 2 : 1,
    borderColor: isExpanded ? colors.primary : colors.border,
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Add subtle shadow when expanded
    ...(isExpanded && {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
  }),
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  contentContainer: {
    flex: 1,
  },
  message: (colors) => ({
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.small,
  }),
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  username: (colors) => ({
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  }),
  separator: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: spacing.small,
  }),
  timestamp: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
  }),
  expandHint: (colors) => ({
    fontSize: 11,
    color: colors.primary,
    fontStyle: 'italic',
    opacity: 0.8,
  }),
  fullDate: (colors) => ({
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
  }),
  rightSection: {
    alignItems: 'flex-end',
  },
  typeChip: {
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: spacing.small,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expandIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default LogItem;

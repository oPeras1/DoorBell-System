import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  PanResponder,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { spacing, borderRadius, shadows } from '../constants/styles';
import { getUnreadNotifications, markNotificationAsRead } from '../services/notificationService';
import { notificationTypes } from '../constants/notifications';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const NotificationCard = ({ notification, index, onPress, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const notificationType = notificationTypes[notification.type] || notificationTypes.system;
  const timeAgo = getTimeAgo(notification.createdAt);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 100,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        delay: index * 100,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      swipeAnim.setValue(gestureState.dx);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > width * 0.3) {
        Animated.timing(swipeAnim, {
          toValue: gestureState.dx > 0 ? width : -width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onDismiss && onDismiss(notification.id));
      } else {
        Animated.spring(swipeAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return (
    <Animated.View
      style={[
        styles.notificationCard,
        {
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim },
            { translateX: swipeAnim }
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.cardContent}
        onPress={async () => {
          try {
            await markNotificationAsRead(notification.id);
          } catch (error) {
            console.error('Error marking as read:', error);
          }
          if (onPress) onPress(notification);
        }}
        activeOpacity={0.8}
      >
        {notification.priority === 'high' && (
          <View style={styles.priorityIndicator} />
        )}
        <View style={[styles.iconContainer, { backgroundColor: notificationType.bgColor }]}>
          <Text style={styles.iconText}>{notificationType.icon}</Text>
        </View>
        <View style={styles.cardTextContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.notificationTypeText}>{notificationType.title}</Text>
          </View>
          <Text style={styles.notificationTitle} numberOfLines={2}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
        <View style={styles.statusTimeContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: notification.read ? colors.textSecondary : notificationType.color }
          ]} />
          <Text style={styles.timeAgoText}>{timeAgo}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const HomeDashboard = ({ notificationsPollingInterval = 30000, navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [seenIds, setSeenIds] = useState([]);
  const [lifetimeTotal, setLifetimeTotal] = useState(0);
  const [todaySeenCount, setTodaySeenCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadSeenNotifications = async () => {
    try {
      const storedLifetime = await AsyncStorage.getItem('lifetimeTotal');
      const storedToday = await AsyncStorage.getItem('todaySeenCount');
      if (storedLifetime) setLifetimeTotal(parseInt(storedLifetime, 10));
      if (storedToday) setTodaySeenCount(parseInt(storedToday, 10));
    } catch (error) {
      console.error('Error loading seen notifications:', error);
    }
  };

  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const data = await getUnreadNotifications();
      const validNotifications = (data || []).filter(n => notificationTypes[n.type]); // Filter valid types
      setNotifications(validNotifications);
      const allIds = validNotifications.map(n => n.id);
      if (allIds.length > seenIds.length) {
        setSeenIds(allIds);
        setLifetimeTotal(allIds.length);
        await AsyncStorage.setItem('seenNotifications', JSON.stringify(allIds));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const incrementSeenCounters = async (count = 1) => {
    try {
      setTodaySeenCount(prev => {
        const updatedToday = prev + count;
        AsyncStorage.setItem('todaySeenCount', updatedToday.toString());
        return updatedToday;
      });
      setLifetimeTotal(prev => {
        const updatedLifetime = prev + count;
        AsyncStorage.setItem('lifetimeTotal', updatedLifetime.toString());
        return updatedLifetime;
      });
    } catch (error) {
      console.error('Error updating seen counters:', error);
    }
  };

  const handleNotificationPress = async (notification) => {
    try {
      if (notification.type === 'PARTY' && notification.partyId) {
        navigation.navigate('PartyDetails', { partyId: notification.partyId });
      } else if (notificationTypes[notification.type]) {
        console.log('Notification pressed:', notification);
      } else {  
        console.warn('Unknown notification type:', notification.type);
      }
      await markNotificationAsRead(notification.id);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      incrementSeenCounters(); // Increment counters when a notification is pressed
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      incrementSeenCounters(); // Increment counters when a notification is dismissed
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const count = notifications.length;
      await Promise.all(notifications.map(n => markNotificationAsRead(n.id)));
      setNotifications([]);
      incrementSeenCounters(count); // Increment counters for all cleared notifications
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleRefresh = () => {
    fetchNotifications(true);
  };

  const todayCount = notifications.filter(n => 
    new Date(n.createdAt).toDateString() === new Date().toDateString()
  ).length;

  useEffect(() => {
    loadSeenNotifications();
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), notificationsPollingInterval);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        <View style={[styles.skeleton, { height: 80 }]} />
        <View style={[styles.skeleton, { height: 120, marginTop: spacing.medium }]} />
        <View style={[styles.skeleton, { height: 100, marginTop: spacing.medium }]} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.notificationsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
        {notifications.length > 0 ? (
          <ScrollView
            style={styles.notificationsList}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          >
            {notifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                index={index}
                onPress={handleNotificationPress}
                onDismiss={handleDismiss}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIconContainer}>
              <MaterialIcons name="check-circle" size={56} color={colors.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>All Clear!</Text>
            <Text style={styles.emptyStateMessage}>
              There are no notifications at the moment.
            </Text>
            <View style={styles.emptyStateStats}>
              <View style={styles.emptyStateBadge}>
                <Text style={styles.emptyStateBadgeLabel}>Today</Text>
                <Text style={styles.emptyStateBadgeNumber}>{todaySeenCount}</Text>
              </View>
              <View style={styles.emptyStateBadge}>
                <Text style={styles.emptyStateBadgeLabel}>Total</Text>
                <Text style={styles.emptyStateBadgeNumber}>{lifetimeTotal}</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffInMinutes < 1) return 'Now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
  return `${Math.floor(diffInMinutes / 1440)}d`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  notificationsSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.small,
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    ...shadows.light,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1,
    textShadowColor: colors.border,
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  notificationsList: {
    flex: 1,
  },
  notificationCard: {
    marginBottom: spacing.medium,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
    marginLeft: -spacing.small, // move icon more to the left
  },
  iconText: {
    fontSize: 36,
    textAlign: 'center',
  },
  cardContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.medium,
    position: 'relative',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    backgroundColor: colors.error,
    borderTopRightRadius: borderRadius.large,
    borderBottomLeftRadius: borderRadius.medium,
  },
  cardTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: spacing.tiny,
    gap: spacing.small,
  },
  notificationTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  timeAgoText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.tiny,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  statusTimeContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.small,
    minWidth: 40,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.tiny,
    backgroundColor: colors.primary,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small,
    padding: spacing.tiny,
  },
  closeText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.extraLarge * 2,
    paddingBottom: spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.light,
  },
  emptyStateIconContainer: {
    borderRadius: 32,
    paddingTop: spacing.large,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.small,
    marginTop: spacing.small,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
    marginHorizontal: spacing.large,
  },
  emptyStateStats: {
    flexDirection: 'row',
    gap: spacing.large,
    marginTop: spacing.small,
    justifyContent: 'center',
  },
  emptyStateBadge: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: colors.border,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    marginHorizontal: spacing.small,
    minWidth: 70,
  },
  emptyStateBadgeLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
  },
  emptyStateBadgeNumber: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  skeletonContainer: {
    padding: spacing.medium,
  },
  skeleton: {
    backgroundColor: colors.border,
    borderRadius: borderRadius.large,
    width: '100%',
  },
});

export default HomeDashboard;
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
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/styles';
import { getUnreadNotifications, markNotificationAsRead } from '../../services/notificationService';
import { notificationTypes } from '../../constants/notifications';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NotificationCard = ({ notification, index, onPress, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
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
        tension: 60,
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
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 20,
    onPanResponderMove: Animated.event([null, { dx: swipeAnim }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gestureState) => {
      if (Math.abs(gestureState.dx) > width * 0.4) {
        Animated.timing(swipeAnim, {
          toValue: gestureState.dx > 0 ? width : -width,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onDismiss && onDismiss(notification.id));
      } else {
        Animated.spring(swipeAnim, {
          toValue: 0,
          friction: 5,
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
        style={styles.cardTouchable}
        onPress={async () => {
          try {
            await markNotificationAsRead(notification.id);
            if (onPress) onPress(notification);
          } catch (error) {
            console.error('Error marking as read:', error);
          }
        }}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          {notification.priority === 'high' && (
            <View style={styles.priorityIndicatorContainer}>
              <Ionicons name="flame" size={14} color={colors.card} />
            </View>
          )}
          <View style={[styles.iconContainer, { backgroundColor: `${notificationType.color}1A` }]}>
            <Text style={[styles.iconText, { color: notificationType.color }]}>{notificationType.icon}</Text>
          </View>
          <View style={styles.cardTextContent}>
            <View style={styles.cardHeader}>
              <Text style={[styles.notificationTypeText, { color: notificationType.color }]}>{notificationType.title}</Text>
              <View style={[
                styles.statusDot,
                { backgroundColor: notification.read ? colors.textSecondary : notificationType.color }
              ]} />
              <Text style={styles.timeAgoText}>{timeAgo}</Text>
            </View>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {notification.title}
            </Text>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const Notifications = ({ notificationsPollingInterval = 30000, navigation }) => {
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
      const validNotifications = (data || []).filter(n => notificationTypes[n.type]);
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
      const newToday = todaySeenCount + count;
      const newLifetime = lifetimeTotal + count;
      setTodaySeenCount(newToday);
      setLifetimeTotal(newLifetime);
      await AsyncStorage.setItem('todaySeenCount', newToday.toString());
      await AsyncStorage.setItem('lifetimeTotal', newLifetime.toString());
    } catch (error) {
      console.error('Error updating seen counters:', error);
    }
  };
  
  const handleNotificationPress = async (notification) => {
    try {
      if (notification.type === 'PARTY' && notification.partyId) {
        navigation.navigate('PartyDetails', { partyId: notification.partyId });
      }
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      incrementSeenCounters();
    } catch (error) {
      console.error('Error handling notification press:', error);
    }
  };

  const handleDismiss = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      incrementSeenCounters();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      const count = notifications.length;
      if (count > 0) {
        await Promise.all(notifications.map(n => markNotificationAsRead(n.id)));
        setNotifications([]);
        incrementSeenCounters(count);
      }
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleRefresh = () => {
    fetchNotifications(true);
  };

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
        <View style={[styles.skeleton, { height: 50, marginBottom: spacing.large }]} />
        <View style={[styles.skeleton, { height: 100, marginBottom: spacing.medium }]} />
        <View style={[styles.skeleton, { height: 100, marginBottom: spacing.medium }]} />
        <View style={[styles.skeleton, { height: 100 }]} />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderContent}>
           <Ionicons name="notifications-outline" size={22} color={colors.primary} />
           <Text style={styles.sectionTitle}>Recent Activity</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
        {notifications.length > 0 ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            contentContainerStyle={styles.notificationsList}
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
              <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.primary} />
            </View>
            <Text style={styles.emptyStateTitle}>All Clear!</Text>
            <Text style={styles.emptyStateMessage}>
              You have no new notifications.
            </Text>
            <View style={styles.emptyStateStats}>
              <View style={styles.emptyStateBadge}>
                <Text style={styles.emptyStateBadgeLabel}>Viewed Today</Text>
                <Text style={styles.emptyStateBadgeNumber}>{todaySeenCount}</Text>
              </View>
              <View style={styles.emptyStateBadge}>
                <Text style={styles.emptyStateBadgeLabel}>Total Viewed</Text>
                <Text style={styles.emptyStateBadgeNumber}>{lifetimeTotal}</Text>
              </View>
            </View>
          </View>
        )}
    </Animated.View>
  );
};

const getTimeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  if (diffInMinutes < 1) return 'now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.large,
    padding: spacing.medium,
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    ...shadows.light,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.small,
  },
  clearAllButton: {
    paddingVertical: spacing.tiny,
    paddingHorizontal: spacing.small,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  notificationsList: {
    paddingBottom: spacing.large,
  },
  notificationCard: {
    marginBottom: spacing.medium,
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    ...shadows.medium,
  },
  cardTouchable: {
    borderRadius: borderRadius.large,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    position: 'relative',
    overflow: 'hidden',
  },
  priorityIndicatorContainer: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 32,
    height: 32,
    backgroundColor: colors.error,
    borderTopRightRadius: borderRadius.large,
    borderBottomLeftRadius: borderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingRight: 4
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  iconText: {
    fontSize: 24,
  },
  cardTextContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.tiny,
    gap: spacing.small,
  },
  notificationTypeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeAgoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
    marginTop: spacing.large,
    backgroundColor: colors.card,
    borderRadius: borderRadius.extraLarge,
    ...shadows.light,
  },
  emptyStateIconContainer: {
    marginBottom: spacing.medium,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.large,
    maxWidth: '80%',
  },
  emptyStateStats: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  emptyStateBadge: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyStateBadgeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  emptyStateBadgeNumber: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
  },
  skeletonContainer: {
    paddingHorizontal: spacing.medium,
  },
  skeleton: {
    backgroundColor: colors.border,
    borderRadius: borderRadius.large,
    width: '100%',
  },
});

export default Notifications;
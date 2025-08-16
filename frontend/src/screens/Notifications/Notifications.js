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
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, shadows } from '../../constants/styles';
import { getUnreadNotifications, markNotificationAsRead } from '../../services/notificationService';
import { notificationTypes } from '../../constants/notifications';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';

const { width } = Dimensions.get('window');

// O componente NotificationCard permanece inalterado.
const NotificationCard = ({ notification, index, onPress, onDismiss }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;

  const notificationType = notificationTypes[notification.type] || notificationTypes.system;
  const timeAgo = getTimeAgo(notification.createdAt);
  const colors = useColors();

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
        style={[styles.cardContent, { backgroundColor: colors.card, borderColor: colors.border }]}
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
          <View style={[styles.priorityIndicator, { backgroundColor: colors.danger }]} />
        )}
        <View style={[styles.iconContainer, { backgroundColor: notificationType.bgColor }]}>
          <Text style={styles.iconText}>{notificationType.icon}</Text>
        </View>
        <View style={styles.cardTextContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.notificationTypeText, { color: colors.primary }]}>{notificationType.title}</Text>
          </View>
          <Text style={[styles.notificationTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {notification.title}
          </Text>
          <Text style={[styles.notificationMessage, { color: colors.textSecondary }]} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>
        <View style={styles.statusTimeContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: notification.read ? colors.textSecondary : notificationType.color }
          ]} />
          <Text style={[styles.timeAgoText, { color: colors.textSecondary }]}>{timeAgo}</Text>
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
  const slideAnim = useRef(new Animated.Value(30)).current; 
  const colors = useColors();

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
      await Promise.all(notifications.map(n => markNotificationAsRead(n.id)));
      setNotifications([]);
      incrementSeenCounters(count);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleRefresh = () => {
    fetchNotifications(true);
  };
  
  const handleBack = () => navigation.goBack();

  useEffect(() => {
    loadSeenNotifications();
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), notificationsPollingInterval);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.skeleton, { height: 80, marginTop: 100, backgroundColor: colors.border }]} />
        <View style={[styles.skeleton, { height: 120, marginTop: spacing.medium, backgroundColor: colors.border }]} />
        <View style={[styles.skeleton, { height: 100, marginTop: spacing.medium, backgroundColor: colors.border }]} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={colors.background === '#23283A' ? "light-content" : "dark-content"} />
      {/* Header redesenhado */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <View style={[styles.headerBackground, { backgroundColor: colors.card, borderBottomColor: colors.border, shadowColor: colors.shadow }]} />
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Your recent activity</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.clearAllButton,
                { backgroundColor: `${colors.primary}15` },
                notifications.length === 0 && { backgroundColor: colors.border }
              ]}
              disabled={notifications.length === 0}
            >
              <Text
                style={[
                  styles.clearAllText,
                  { color: colors.primary },
                  notifications.length === 0 && { color: colors.textSecondary }
                ]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[
        { flex: 1, opacity: fadeAnim },
        notifications.length > 0 ? { transform: [{ translateY: slideAnim }] } : {}
      ]}>
        {notifications.length > 0 ? (
          <ScrollView
            style={styles.notificationsList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                progressViewOffset={Platform.OS === 'android' ? 100 : 0}
              />
            }
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
          <ScrollView
            contentContainerStyle={styles.emptyStateContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                progressViewOffset={Platform.OS === 'android' ? 100 : 0}
              />
            }
          >
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <EmptyStateIcon colors={colors} />
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>All clear!</Text>
              <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
                You have no new notifications.
              </Text>
              <View style={styles.emptyStateStats}>
                <View style={[styles.emptyStateBadge, { backgroundColor: `${colors.primary}10`, borderColor: colors.border }]}>
                  <Text style={[styles.emptyStateBadgeLabel, { color: colors.textSecondary }]}>Seen today</Text>
                  <Text style={[styles.emptyStateBadgeNumber, { color: colors.primary }]}>{todaySeenCount}</Text>
                </View>
                <View style={[styles.emptyStateBadge, { backgroundColor: `${colors.primary}10`, borderColor: colors.border }]}>
                  <Text style={[styles.emptyStateBadgeLabel, { color: colors.textSecondary }]}>Total seen</Text>
                  <Text style={[styles.emptyStateBadgeNumber, { color: colors.primary }]}>{lifetimeTotal}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
};

const EmptyStateIcon = ({ colors }) => {
  const wave1Scale = useRef(new Animated.Value(0)).current;
  const wave1Opacity = useRef(new Animated.Value(1)).current;
  const wave2Scale = useRef(new Animated.Value(0)).current;
  const wave2Opacity = useRef(new Animated.Value(1)).current;
  const wave3Scale = useRef(new Animated.Value(0)).current;
  const wave3Opacity = useRef(new Animated.Value(1)).current;

  const startWaveAnimation = (scaleAnim, opacityAnim, delay = 0) => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 4,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  useEffect(() => {
    startWaveAnimation(wave1Scale, wave1Opacity, 0);
    startWaveAnimation(wave2Scale, wave2Opacity, 600);
    startWaveAnimation(wave3Scale, wave3Opacity, 1200);
  }, []);

  return (
    <View style={styles.emptyStateIconContainer}>
      <Animated.View
        style={[
          styles.wave,
          {
            borderColor: `${colors.primary}40`,
            transform: [{ scale: wave1Scale }],
            opacity: wave1Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          {
            borderColor: `${colors.primary}40`,
            transform: [{ scale: wave2Scale }],
            opacity: wave2Opacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          {
            borderColor: `${colors.primary}40`,
            transform: [{ scale: wave3Scale }],
            opacity: wave3Opacity,
          },
        ]}
      />
      <Ionicons name="checkmark-done-circle-outline" size={64} color={colors.primary} />
    </View>
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        borderBottomWidth: 1.5,
        borderBottomColor: colors.border,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    paddingTop: spacing.medium,
  },
  headerBackButton: {
    padding: spacing.small,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  clearAllButton: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
  },
  clearAllButtonDisabled: {
    backgroundColor: colors.border,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  clearAllTextDisabled: {
    color: colors.textSecondary,
  },
  notificationsList: {
    flex: 1,
  },
  scrollContent: {
    paddingTop:
      Platform.OS === 'ios'
        ? 40 + 70
        : Platform.OS === 'android'
        ? (StatusBar.currentHeight || 0) + 70
        : 100,
    paddingHorizontal: spacing.medium,
    paddingBottom: spacing.large,
  },
  emptyStateContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationCard: {
    marginBottom: spacing.medium,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.medium,
  },
  iconText: {
    fontSize: 32,
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityIndicator: {
    position: 'absolute',
    top: -1,
    right: 12,
    width: 14,
    height: 24,
    backgroundColor: colors.error,
    borderBottomLeftRadius: borderRadius.medium,
    borderBottomRightRadius: borderRadius.medium,
    borderTopRightRadius: borderRadius.large,
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
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.extraLarge,
    ...shadows.light,
  },
  emptyStateIconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
    backgroundColor: 'transparent',
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.small / 2,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxlarge,
    maxWidth: '80%',
  },
  emptyStateStats: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  emptyStateBadge: {
    alignItems: 'center',
    backgroundColor: `${colors.primary}10`,
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
    padding: spacing.medium,
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  skeleton: {
    backgroundColor: colors.border,
    borderRadius: borderRadius.large,
    width: '100%',
  },
});

export default Notifications;
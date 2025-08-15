import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';
import { updateGuestStatus } from '../services/partyService';
import { PARTY_TYPE_CONFIG, GUEST_STATUS_CONFIG, STATUS_CONFIG } from '../constants/party';
import { AuthContext } from '../context/AuthContext';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = Math.min(screenWidth * 0.9, 400);
const isWeb = Platform.OS === 'web';

const GradientBackground = Platform.OS === 'web'
  ? ({ children, colors: gradientColors, style }) => (
      <View style={[style, { background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})` }]}>
        {children}
      </View>
    )
  : ({ children, colors, style }) => (
      <LinearGradient colors={colors} style={style} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        {children}
      </LinearGradient>
    );

const PartyEventsCarousel = ({ navigation, parties = [], isLoading = false }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [userParties, setUserParties] = useState([]);
  const [error, setError] = useState(null);
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCards, setTotalCards] = useState(0);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  const slideAnim = useRef(new Animated.Value(isWeb ? 30 : 0)).current;
  const fadeAnim = useRef(new Animated.Value(isWeb ? 0 : 1)).current;

  useEffect(() => {
    if (isWeb && !isInitialized) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start(() => setIsInitialized(true));
    } else if (!isWeb) {
      setIsInitialized(true);
    }
  }, [isWeb, isInitialized]);

  useEffect(() => {
    if (Array.isArray(parties) && currentUser?.id) {
      const filteredParties = parties
        .filter(p => p && p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
        .filter(party => {
          if (!party) return false;
          // If user is host
          if (party.host && party.host.id === currentUser.id) return true;

          // If user is guest
          return Array.isArray(party.guests) && party.guests.some(guest => guest.user && guest.user.id === currentUser.id);
        });

      setUserParties(filteredParties);
      setTotalCards(filteredParties.length);
    }
  }, [parties, currentUser?.id]);

  const handleUpdateStatus = async (partyId, status) => {
    try {
      setStatusUpdating(prev => ({ ...prev, [partyId]: true }));
      await updateGuestStatus(partyId, currentUser.id, status);

      setUserParties(currentParties =>
        currentParties.map(party => {
          if (party.id === partyId) {
            const updatedGuests = party.guests.map(guest => {
              if (guest.user.id === currentUser.id) {
                return {
                  ...guest,
                  status,
                  updatedAt: new Date().toISOString()
                };
              }
              return guest;
            });
            return { ...party, guests: updatedGuests };
          }
          return party;
        })
      );
    } catch (err) {
      console.error('Error updating guest status:', err);
    } finally {
      setStatusUpdating(prev => ({ ...prev, [partyId]: false }));
    }
  };

  const scrollToNext = () => {
    if (currentIndex < totalCards - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * cardWidth + (nextIndex * spacing.medium),
        animated: true
      });
      setCurrentIndex(nextIndex);
    }
  };

  const scrollToPrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollViewRef.current?.scrollTo({
        x: prevIndex * cardWidth + (prevIndex * spacing.medium),
        animated: true
      });
      setCurrentIndex(prevIndex);
    }
  };

  const handleScroll = (event) => {
    if (!isWeb) {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(contentOffsetX / (cardWidth + spacing.medium));
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < totalCards) {
        setCurrentIndex(newIndex);
      }
    }
  };

  const handleCardPress = (partyId) => {
    navigation.navigate('PartyDetails', { partyId });
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const formatTime = (dateTime) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Check if the user is a guest who hasn't responded yet
  const needsResponse = (party) => {
    if (!party) return false;
    if (party.host && party.host.id === currentUser.id) return false;

    const userGuest = Array.isArray(party.guests) && party.guests.find(guest => guest.user && guest.user.id === currentUser.id);
    return userGuest && (!userGuest.updatedAt || userGuest.status === 'UNDECIDED');
  };

  const getUserStatus = (party) => {
    if (!party) return 'UNDECIDED';
    if (party.host && party.host.id === currentUser.id) return 'HOST';

    const userGuest = Array.isArray(party.guests) && party.guests.find(guest => guest.user && guest.user.id === currentUser.id);
    return userGuest ? userGuest.status : 'UNDECIDED';
  };

  if (isLoading && userParties.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.danger} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const noParties = userParties.length === 0;

  const containerStyle = isWeb 
    ? [styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]
    : styles.container;

  return (
    <Animated.View style={containerStyle}>
      {/* Header always visible */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={24} color={colors.primary} />
          <View style={styles.headerTextGroup}>
            <Text style={styles.headerTitle}>Your Events</Text>
            <Text style={styles.headerSubtitle}>Upcoming events and invitations</Text>
          </View>
        </View>

        {isWeb && userParties.length > 1 && (
          <View style={styles.arrowControls}>
            <TouchableOpacity
              style={[styles.arrowButton, currentIndex === 0 && styles.arrowButtonDisabled]}
              onPress={scrollToPrevious}
              disabled={currentIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={currentIndex === 0 ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.arrowButton, currentIndex === totalCards - 1 && styles.arrowButtonDisabled]}
              onPress={scrollToNext}
              disabled={currentIndex === totalCards - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={currentIndex === totalCards - 1 ? colors.textSecondary : colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* If no parties, show empty state below header; otherwise show the carousel */}
      {noParties ? (
        <View style={styles.emptyStateCard}>
          <View style={styles.emptyIconContainer}>
            <View style={styles.emptyIconBackground}>
              <Ionicons name="calendar-outline" size={32} color={colors.primary} />
            </View>
            <View style={styles.emptyIconDecoration}>
              <Ionicons name="ellipse" size={8} color={`${colors.primary}30`} />
              <Ionicons name="ellipse" size={6} color={`${colors.primary}20`} />
              <Ionicons name="ellipse" size={4} color={`${colors.primary}15`} />
            </View>
          </View>
          
          <View style={styles.emptyTextContainer}>
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySubtitle}>
              You're all caught up! When you receive party invitations or create events, they'll appear here.
            </Text>
          </View>

          <View style={styles.emptyDecorationContainer}>
            <View style={styles.emptyDecorationLine} />
            <View style={styles.emptyDecorationDot} />
            <View style={styles.emptyDecorationLine} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + spacing.medium}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            removeClippedSubviews={false}
            scrollEnabled={!isLoading}
          >
            {userParties.map((party, index) => {
              const typeConfig = PARTY_TYPE_CONFIG[party.type] || PARTY_TYPE_CONFIG.HOUSE_PARTY;
              const statusConfig = STATUS_CONFIG[party.status] || STATUS_CONFIG.SCHEDULED;
              const userStatus = getUserStatus(party);
              const isHost = party.host && party.host.id === currentUser.id;
              const requiresResponse = needsResponse(party);
              const isUpdating = statusUpdating[party.id] || false;

              return (
                <TouchableOpacity
                  key={`${party.id}-${index}`}
                  style={styles.card}
                  onPress={() => handleCardPress(party.id)}
                  activeOpacity={0.9}
                  disabled={isUpdating}
                >
                  <GradientBackground colors={typeConfig.gradient} style={styles.cardHeader}>
                    <View style={styles.cardHeaderTop}>
                      <View style={styles.partyTypeContainer}>
                        <View style={styles.partyTypeIcon}>
                          <Ionicons name={typeConfig.icon} size={16} color="#fff" />
                        </View>
                        <Text style={styles.partyType}>{typeConfig.name}</Text>
                      </View>
                      <View style={styles.partyStatusBadge}>
                        <Ionicons name={statusConfig.icon} size={14} color="#fff" />
                        <Text style={styles.partyStatusText}>{statusConfig.name}</Text>
                      </View>
                    </View>

                    <Text style={styles.partyName} numberOfLines={1}>{party.name}</Text>

                    <View style={styles.partyTime}>
                      <Ionicons name="time-outline" size={16} color="#fff" />
                      <Text style={styles.partyTimeText}>
                        {formatDate(party.dateTime)} • {formatTime(party.dateTime)}
                      </Text>
                    </View>
                  </GradientBackground>

                  <View style={styles.cardBody}>
                    {/* Host info */}
                    <View style={styles.hostContainer}>
                      <View style={styles.hostInfo}>
                        <Text style={styles.hostLabel}>
                          {isHost ? 'You are hosting this party' : `Hosted by ${party.host.username}`}
                        </Text>
                        <View style={styles.attendeesPreview}>
                          <Text style={styles.attendeesCount}>
                            {party.guests.length + 1} {party.guests.length === 0 ? 'person' : 'people'}
                          </Text>
                          <View style={styles.attendeesDivider} />
                          {isHost ? (
                            <View style={styles.hostBadge}>
                              <Text style={styles.hostBadgeText}>HOST</Text>
                            </View>
                          ) : (
                            <View style={[
                              styles.guestStatusBadge,
                              { backgroundColor: GUEST_STATUS_CONFIG[userStatus]?.color || colors.textSecondary }
                            ]}>
                              <Text style={styles.guestStatusText}>
                                {GUEST_STATUS_CONFIG[userStatus]?.name || 'Undecided'}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Quick response buttons for undecided guests */}
                    {requiresResponse && (
                      <View style={styles.responseActions}>
                        {isUpdating ? (
                          <ActivityIndicator size="small" color={colors.primary} style={styles.updatingIndicator} />
                        ) : (
                          <View style={styles.responseButtons}>
                            <TouchableOpacity
                              style={[styles.responseButton, styles.responseButtonGoing]}
                              onPress={() => handleUpdateStatus(party.id, 'GOING')}
                            >
                              <Ionicons name="checkmark" size={18} color="#fff" />
                              <Text style={styles.responseButtonText}>Going</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.responseButton, styles.responseButtonNotGoing]}
                              onPress={() => handleUpdateStatus(party.id, 'NOT_GOING')}
                            >
                              <Ionicons name="close" size={18} color="#fff" />
                              <Text style={styles.responseButtonText}>Not Going</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                        <Text style={styles.responsePrompt}>Please respond to this invitation</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.cardFooter}>
                    <View style={styles.viewDetails}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {!isWeb && userParties.length > 1 && (
            <View style={styles.pagination}>
              {userParties.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    currentIndex === index ? styles.paginationDotActive : {}
                  ]}
                />
              ))}
            </View>
          )}
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.large,
    ...(Platform.OS !== 'web' && { opacity: 1 }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.large,
    paddingHorizontal: spacing.large,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  headerTextGroup: {
    flexDirection: 'column',
    marginLeft: spacing.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  arrowControls: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButtonDisabled: {
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.small,
    gap: spacing.medium,
    alignItems: 'flex-start',
  },
  card: {
    width: cardWidth,
    borderRadius: borderRadius.large,
    backgroundColor: colors.card,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    opacity: 1,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  cardHeader: {
    padding: spacing.large,
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  partyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  partyTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.small,
  },
  partyType: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '600',
  },
  partyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  partyStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  partyName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: spacing.medium,
  },
  partyTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xsmall,
  },
  partyTimeText: {
    color: '#fff',
    fontSize: 14,
  },
  cardBody: {
    padding: spacing.large,
  },
  hostContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  hostInfo: {
    flex: 1,
  },
  hostLabel: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  attendeesPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  attendeesDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: spacing.small,
  },
  hostBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hostBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  guestStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  guestStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  responseActions: {
    marginTop: spacing.large,
    alignItems: 'center',
  },
  responseButtons: {
    flexDirection: 'row',
    gap: spacing.medium,
    marginBottom: spacing.small,
  },
  responseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.small,
  },
  responseButtonGoing: {
    backgroundColor: colors.success,
  },
  responseButtonNotGoing: {
    backgroundColor: colors.danger,
  },
  responseButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  responsePrompt: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  updatingIndicator: {
    marginVertical: spacing.medium,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  viewDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.medium,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 16,
  },
  loadingContainer: {
    padding: spacing.xxlarge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    padding: spacing.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: spacing.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Enhanced empty state styles
  emptyStateCard: {
    marginHorizontal: spacing.large,
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.xxlarge,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  emptyIconContainer: {
    position: 'relative',
    marginBottom: spacing.large,
  },
  emptyIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: `${colors.primary}20`,
  },
  emptyIconDecoration: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    gap: 4,
  },
  emptyTextContainer: {
    alignItems: 'center',
    marginBottom: spacing.large,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.small,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  emptyDecorationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  emptyDecorationLine: {
    width: 30,
    height: 1,
    backgroundColor: `${colors.primary}20`,
  },
  emptyDecorationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: `${colors.primary}40`,
  },
});

export default PartyEventsCarousel;
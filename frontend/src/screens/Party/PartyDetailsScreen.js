import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { getPartyById } from '../../services/partyService';
import HousePlanSelector from '../../components/HousePlanSelector';
import { LinearGradient } from 'expo-linear-gradient';
import { PARTY_TYPE_CONFIG, STATUS_CONFIG, GUEST_STATUS_CONFIG } from '../../constants/party';

const GradientBackground = Platform.OS === 'web'
  ? ({ children, colors: gradientColors, style }) => (
      <View style={[style, { background: `linear-gradient(135deg, ${gradientColors[0]}, ${gradientColors[1]})` }]}>
        {children}
      </View>
    )
  : ({ children, colors, style }) => (
      <LinearGradient colors={colors} style={style}>
        {children}
      </LinearGradient>
    );

const PartyDetailsScreen = ({ navigation, route }) => {
  const { partyId } = route.params;
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchPartyDetails();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();
  }, [partyId]);

  const fetchPartyDetails = async () => {
    try {
      setLoading(true);
      const data = await getPartyById(partyId);
      setParty(data);
    } catch (error) {
      console.error('Error fetching party details:', error);
      setErrorMessage('Failed to load party details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigation.goBack();

  const formatDate = (dateTime) => {
    if (!dateTime) return null;
    const d = new Date(dateTime);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };
  const formatTime = (dateTime) => {
    if (!dateTime) return null;
    return new Date(dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getDuration = () => {
    if (!party?.dateTime || !party?.endDateTime) return '';
    const start = new Date(party.dateTime);
    const end = new Date(party.endDateTime);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let durationString = '';
    if (hours > 0) durationString += `${hours}h `;
    if (minutes > 0) durationString += `${minutes}min`;
    return durationString.trim();
  };

  const formatRooms = () => {
    if (!party?.rooms || party.rooms.length === 0) return 'No rooms selected';
    const roomNames = {
      WC1: 'WC 1', WC2: 'WC 2', KITCHEN: 'Kitchen', LIVING_ROOM: 'Living Room',
      HUGO_B: "Hugo's Room", LEO_B: "Leo's Room", VIC_B: "Vic's Room",
      FILIPE_B: "Filipe's Room", GUI_B: "Guilherme's Room", BALCONY: 'Balcony'
    };
    if (party.rooms.length > 2) {
        return `${party.rooms.length} rooms selected`;
    }
    return party.rooms.map(room => roomNames[room] || room).join(', ');
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxLarge,
        paddingHorizontal: spacing.large,
        minHeight: 200,
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading party details...</Text>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.errorCard}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
          </View>
          <Text style={styles.errorTitle}>Party Not Found</Text>
          <Text style={styles.errorSubtitle}>The party you're looking for doesn't exist.</Text>
          <TouchableOpacity style={styles.errorButton} onPress={handleBack}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const typeConfig = PARTY_TYPE_CONFIG[party.type] || PARTY_TYPE_CONFIG.HOUSE_PARTY;
  const statusConfig = STATUS_CONFIG[party.status] || STATUS_CONFIG.SCHEDULED;

  return (
    <>
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        
        <Animated.View style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.headerBackground} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>Party details</Text>
              <Text style={styles.headerSubtitle}>Everything to this party</Text>
            </View>
            <View style={styles.headerRight}>
              <GradientBackground
                colors={statusConfig.gradient || [statusConfig.color, statusConfig.color]}
                style={styles.headerStatusBadge}
              >
                <Ionicons name={statusConfig.icon} size={14} color="white" />
                <Text style={styles.headerStatusText}>{statusConfig.name}</Text>
              </GradientBackground>
            </View>
          </View>
        </Animated.View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={{ 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }], 
              gap: spacing.large 
            }}>
            
              {/* Hero Card */}
              <GradientBackground
                colors={typeConfig.gradient}
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  <View style={styles.heroHeader}>
                    <View style={styles.heroIconContainer}>
                      <Ionicons name={typeConfig.icon} size={32} color="white" />
                    </View>
                    <View style={styles.heroTitleBox}>
                      <Text style={styles.heroTitle}>{party.name}</Text>
                      <Text style={styles.heroType}>{typeConfig.name}</Text>
                    </View>
                  </View>

                  {party.description && (
                    <Text style={styles.heroDescription}>{party.description}</Text>
                  )}

                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <Ionicons name="people" size={18} color="white" />
                      <Text style={styles.heroStatText}>
                        {1 + (party.guests?.length || 0)} people
                      </Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Ionicons name="time" size={18} color="white" />
                      <Text style={styles.heroStatText}>{getDuration()}</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Ionicons name="location" size={18} color="white" />
                      <Text style={styles.heroStatText}>
                        {party.rooms?.length || 0} rooms
                      </Text>
                    </View>
                  </View>
                </View>
              </GradientBackground>

              {/* Timeline card */}
              <View style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <Ionicons name="calendar" size={24} color={colors.primary} />
                  <Text style={styles.timelineTitle}>Schedule</Text>
                </View>
                <View style={styles.timelineContainer}>
                  <View style={styles.timelinePoint}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>START</Text>
                      <Text style={styles.timelineDate}>{formatDate(party.dateTime)}</Text>
                      <Text style={styles.timelineTime}>{formatTime(party.dateTime)}</Text>
                    </View>
                  </View>
                  <View style={styles.timelineMiddle}>
                    <View style={styles.timelineLine} />
                    <View style={styles.durationContainer}>
                      <Text style={styles.durationText}>{getDuration()}</Text>
                    </View>
                  </View>
                  <View style={styles.timelinePoint}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.textSecondary }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>END</Text>
                      <Text style={styles.timelineDate}>{formatDate(party.endDateTime)}</Text>
                      <Text style={styles.timelineTime}>{formatTime(party.endDateTime)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* People card */}
              <View style={styles.peopleCard}>
                <View style={styles.peopleHeader}>
                  <View style={styles.peopleHeaderLeft}>
                    <Ionicons name="people" size={24} color={colors.primary} />
                    <Text style={styles.peopleTitle}>Attendees</Text>
                  </View>
                  <View style={styles.attendeeBadge}>
                    <Text style={styles.attendeeCount}>{1 + (party.guests?.length || 0)}</Text>
                  </View>
                </View>

                {/* Host Card */}
                <View style={styles.hostContainer}>
                  <View style={styles.hostCard}>
                    <GradientBackground
                      colors={[colors.primary, '#7C3AED']}
                      style={styles.hostAvatar}
                    >
                      <Text style={styles.hostAvatarText}>
                        {party.host?.username?.charAt(0).toUpperCase() || 'H'}
                      </Text>
                    </GradientBackground>
                    <View style={styles.hostInfo}>
                      <Text style={styles.hostName}>{party.host?.username}</Text>
                      <Text style={styles.hostLabel}>Party Host</Text>
                    </View>
                    <View style={styles.crownContainer}>
                      <Ionicons name="star" size={20} color="#F59E0B" />
                    </View>
                  </View>
                </View>

                {/* Guests Grid */}
                {party.guests && party.guests.length > 0 ? (
                  <View style={styles.guestsGrid}>
                    {party.guests.map((guest, index) => {
                      const guestStatus = GUEST_STATUS_CONFIG[guest.status] || GUEST_STATUS_CONFIG.UNDECIDED;
                      return (
                        <View key={index} style={styles.guestCard}>
                          <GradientBackground
                            colors={guestStatus.gradient || [guestStatus.color, guestStatus.color]}
                            style={styles.guestAvatar}
                          >
                            <Ionicons name={guestStatus.icon} size={16} color="white" />
                          </GradientBackground>
                          <View style={styles.guestInfo}>
                            <Text style={styles.guestName} numberOfLines={1}>
                              {guest.user?.username || 'Unknown'}
                            </Text>
                            <Text style={styles.guestStatus}>{guestStatus.name}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.noGuestsContainer}>
                    <Ionicons name="person-add-outline" size={32} color={colors.textSecondary} />
                    <Text style={styles.noGuestsText}>No guests invited yet</Text>
                  </View>
                )}
              </View>

              {/* Location Card */}
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <Ionicons name="home" size={24} color={colors.primary} />
                  <View style={styles.locationHeaderText}>
                    <Text style={styles.locationTitle}>Location</Text>
                    <Text style={styles.locationSubtitle}>{formatRooms()}</Text>
                  </View>
                </View>
                
                <View style={styles.housePlanContainer}>
                  <HousePlanSelector
                    visible={true}
                    selectedRooms={party.rooms || []}
                    onRoomsSelect={() => {}}
                    onClose={() => {}}
                    multiSelect={true}
                    viewOnly={true}
                  />
                </View>
              </View>

            </Animated.View>
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        borderBottom: `1.5px solid ${colors.border}`,
        boxShadow: '0 2px 12px rgba(67,97,238,0.10), 0 1.5px 0px rgba(67,97,238,0.08)',
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
    borderRadius: borderRadius.small,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.medium,
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
  headerRight: {},
  headerStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  headerStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 120 : 140,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large,
  },

  heroCard: {
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)',
      },
    }),
  },
  heroContent: {
    padding: spacing.large,
    gap: spacing.large,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleBox: { flex: 1 },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  heroType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  heroDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
  },
  heroStat: {
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  timelineCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { border: `1px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(67,97,238,0.08)' },
    }),
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.large,
    justifyContent: 'center',
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.medium,
    gap: spacing.medium,
    width: '100%',
  },
  timelinePoint: {
    alignItems: 'center',
    flex: 1,
    minWidth: 90,
    justifyContent: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: spacing.small,
  },
  timelineContent: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
    width: '100%',
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  timelineTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    width: '100%',
  },
  timelineMiddle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    position: 'relative',
  },
  timelineLine: {
    height: 2,
    width: '100%',
    backgroundColor: colors.border,
    marginBottom: 5,
    marginTop: 5,
  },
  durationContainer: {
    position: 'absolute',//
    top: Platform.OS === 'web' ? '35%' : '15%', 
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: Platform.OS === 'web' ? -30 : -40 }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    backgroundColor: 'transparent',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },

  peopleCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 20px rgba(67,97,238,0.08)',
      },
    }),
  },
  peopleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peopleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  peopleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  attendeeBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attendeeCount: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  hostContainer: {
    marginBottom: spacing.small,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    gap: spacing.medium,
  },
  hostAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
  hostInfo: { flex: 1 },
  hostName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  hostLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  crownContainer: {
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 20,
  },
  guestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.small,
    borderRadius: borderRadius.medium,
    width: '48%',
    gap: spacing.small,
  },
  guestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestInfo: { flex: 1 },
  guestName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  guestStatus: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noGuestsContainer: {
    alignItems: 'center',
    padding: spacing.large,
    gap: spacing.small,
  },
  noGuestsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  locationCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 20px rgba(67,97,238,0.08)',
      },
    }),
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  locationHeaderText: { flex: 1 },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  housePlanContainer: {
    height: 320,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
  },

  loadingCard: {
    backgroundColor: colors.card,
    padding: spacing.xxLarge,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    gap: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    }),
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: colors.card,
    padding: spacing.xxLarge,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    gap: spacing.large,
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    }),
  },
  errorIconContainer: {
    backgroundColor: '#FEE2E2',
    padding: spacing.large,
    borderRadius: 50,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
  },
  errorButtonText: {
    color: colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
});

export default PartyDetailsScreen;
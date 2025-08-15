import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, StatusBar, Animated, Image, Text, TouchableOpacity, Modal, Pressable, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import BottomNavBar from '../../components/BottomNavBar';
import EventsSection from '../../components/PartyEventsCarousel';
import { getMe } from '../../services/userService';
import { hasUnreadNotifications } from '../../services/notificationService';
import { openDoor, getDoorPing, getDoorEnvironment } from '../../services/doorService';
import { getParties } from '../../services/partyService';
import { USER_TYPE_INFO, CONNECTION_MODES } from '../../constants/users';
import { BlurView } from 'expo-blur';
import HousePlanSelector from '../../components/HousePlanSelector';

import {
  getTimeOfDayImage,
  getTimeBasedGreeting,
  getAvatarSource,
} from '../../constants/functions';

const SCREEN_WIDTH = Platform.OS === 'web'
  ? window.innerWidth
  : require('react-native').Dimensions.get('window').width;
const isSmallScreen = SCREEN_WIDTH < 370;

const HomeScreen = ({ navigation }) => {
  const { user: currentUser, logout, setUser } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Dropdown/profile logic
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState('ONLINE');
  const [dropdownAnimation] = useState(new Animated.Value(0));

  const [hasUnreadNotificationsState, setHasUnreadNotificationsState] = useState(false);
  const notificationDotScale = useRef(new Animated.Value(1)).current;

  // Door functionality states
  const [isDoorLoading, setIsDoorLoading] = useState(false);
  const [doorStatus, setDoorStatus] = useState(null);
  const [doorPing, setDoorPing] = useState(null);
  const [doorEnvironment, setDoorEnvironment] = useState(null);

  // Random facts state
  const [currentFact, setCurrentFact] = useState('Did you know the QR Code was invented in Japan?');
  const [isFactLoading, setIsFactLoading] = useState(false);
  const factOpacity = useRef(new Animated.Value(1)).current;

  // New Party data states
  const [allParties, setAllParties] = useState([]);
  const [occupiedRooms, setOccupiedRooms] = useState([]);
  const [isPartiesLoading, setIsPartiesLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation ref for house plan
  const housePlanAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserData();
    fetchDoorData();
    fetchRandomFact();
    fetchPartyData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();

    // Set up fact refresh interval (15 seconds)
    const factInterval = setInterval(fetchRandomFact, 15000);
    
    // Set up door data refresh interval (30 seconds)
    const doorInterval = setInterval(fetchDoorData, 30000);

    // Set up party data refresh interval (30 seconds)
    const partiesInterval = setInterval(fetchPartyData, 30000);

    return () => {
      clearInterval(factInterval);
      clearInterval(doorInterval);
      clearInterval(partiesInterval);
    };
  }, []);

  useEffect(() => {
    if (allParties.length > 0) {
      Animated.timing(housePlanAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    }
  }, [allParties]);

  const fetchUserData = async () => {
    try {
      setIsLoadingUser(true);
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await logout();
        return;
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchDoorData = async () => {
    try {
      const [pingData, envData] = await Promise.all([
        getDoorPing().catch(() => null),
        getDoorEnvironment().catch(() => null)
      ]);
      
      setDoorPing(pingData);
      setDoorEnvironment(envData);
    } catch (error) {
      console.log('Error fetching door data:', error);
    }
  };

  const fetchPartyData = async () => {
    try {
      setIsPartiesLoading(true);
      const data = await getParties();
      setAllParties(data || []);
      
      const now = new Date();
      const occupiedRoomIds = [];
      
      (data || []).forEach(party => {
        if (party.status === 'IN_PROGRESS') {
          const partyStart = new Date(party.dateTime);
          const partyEnd = new Date(party.endDateTime || party.dateTime);
          
          // Add 3 hours buffer if no endDateTime is specified
          if (!party.endDateTime) {
            partyEnd.setHours(partyEnd.getHours() + 3);
          }
          
          if (now >= partyStart && now <= partyEnd && Array.isArray(party.rooms)) {
            occupiedRoomIds.push(...party.rooms);
          }
        }
      });
      
      // Remove duplicates
      setOccupiedRooms([...new Set(occupiedRoomIds)]);
    } catch (error) {
      console.log('Error fetching party data:', error);
    } finally {
      setIsPartiesLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRandomFact = async () => {
    setIsFactLoading(true);

    Animated.timing(factOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      let factText = 'Did you know the QR Code was invented in Japan?';

      try {
        const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
        const data = await response.json();
        factText = data.text.trim();
      } catch (fetchError) {
        console.log('Fetch failed:', fetchError);
      }

      setCurrentFact(factText);
      setIsFactLoading(false);

      Animated.timing(factOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleOpenDoor = async () => {
    try {
      setIsDoorLoading(true);
      const result = await openDoor();
      setDoorStatus(result);
      
      setTimeout(fetchDoorData, 1000);
      
    } catch (error) {
      console.log('Error opening door:', error);
      setDoorStatus({ error: 'Failed to open door' });
    } finally {
      setIsDoorLoading(false);
    }
  };

  useEffect(() => {
    let intervalId;
    const fetchUnread = () => {
      hasUnreadNotifications()
        .then(setHasUnreadNotificationsState)
        .catch(() => setHasUnreadNotificationsState(false));
    };
    fetchUnread();
    intervalId = setInterval(fetchUnread, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (hasUnreadNotificationsState) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(notificationDotScale, { toValue: 1.2, duration: 600, useNativeDriver: true }),
          Animated.timing(notificationDotScale, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      notificationDotScale.setValue(1);
    }
  }, [hasUnreadNotificationsState]);

  // Dropdown animation handlers
  const toggleDropdown = () => {
    if (dropdownVisible) {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }).start(() => setDropdownVisible(false));
    } else {
      setDropdownVisible(true);
      Animated.timing(dropdownAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    toggleDropdown();
  };

  const handleLogout = () => {
    toggleDropdown();
    logout && logout();
  };

  const handleNotificationsPress = () => {
    navigation?.navigate('Notifications', { notificationsPollingInterval: 30000 });
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    
    // Refresh all data
    Promise.all([
      fetchUserData(),
      fetchDoorData(),
      fetchRandomFact(),
      fetchPartyData()
    ]).finally(() => {
      setRefreshing(false);
    });
  }, []);

  const getCurrentModeInfo = () => CONNECTION_MODES[selectedMode] || CONNECTION_MODES.ONLINE;

  const getDoorStatusColor = () => {
    if (doorPing?.status === 'online') return colors.success;
    if (doorPing?.status === 'offline') return colors.danger;
    return colors.warning;
  };

  const getDoorStatusText = () => {
    if (!doorPing) return 'Unknown';
    return doorPing.status === 'online' ? 'Online' : 'Offline';
  };

  const getFormattedPing = (ping) => {
    if (typeof ping === 'number') {
      return ping.toFixed(3);
    }
    if (typeof ping === 'string' && !isNaN(Number(ping))) {
      return Number(ping).toFixed(3);
    }
    return 'N/A';
  };

  const getFormattedHumidity = (humidity) => {
    if (typeof humidity === 'number') {
      return (humidity * 100).toFixed(1);
    }
    if (typeof humidity === 'string' && !isNaN(Number(humidity))) {
      return (Number(humidity) * 100).toFixed(1);
    }
    return 'N/A';
  };

  // Helper to split long usernames
  const getFormattedUserName = (username) => {
    if (!username) return '';
    if (username.length <= 8) return username;
    const chunks = [];
    for (let i = 0; i < username.length; i += 8) {
      chunks.push(username.slice(i, i + 8));
    }
    return chunks.join('\n');
  };

  const isDoorOnline = doorPing && doorPing.status === 'online';

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Torna o conteúdo scrollable com refresh */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.imageContainer}>
          <Image source={getTimeOfDayImage()} style={styles.timeImage} resizeMode="cover" />
          <LinearGradient colors={['transparent', colors.background]} style={styles.imageFade} start={{ x: 0.5, y: 0.6 }} end={{ x: 0.5, y: 1 }} />

          {/* Glass Controls (notifications, profile, etc.) */}
          <View style={styles.glassControlsContainer}>
            {/* Dark Mode Button */}
            <View style={styles.glassItem}>
              <TouchableOpacity style={styles.glassButton} activeOpacity={0.7}>
                <Ionicons name="moon-outline" size={isSmallScreen ? 16 : 22} color={colors.card} />
              </TouchableOpacity>
            </View>
            {/* Notification Button */}
            <View style={styles.glassItem}>
              <TouchableOpacity style={styles.glassButton} activeOpacity={0.7} onPress={handleNotificationsPress}>
                <Ionicons name="notifications-outline" size={isSmallScreen ? 16 : 22} color={colors.card} />
                {hasUnreadNotificationsState && (
                  <Animated.View style={[
                    styles.notificationDot,
                    { transform: [{ scale: notificationDotScale }] }
                  ]} />
                )}
              </TouchableOpacity>
            </View>
            {/* Profile Button */}
            <View style={styles.glassItem}>
              <TouchableOpacity style={styles.profileContainer} onPress={toggleDropdown} activeOpacity={0.8}>
                <View style={styles.profileAvatarGlow} />
                <Image
                  source={getAvatarSource(currentUser?.userType)}
                  style={[
                    styles.profileImage,
                    isSmallScreen && styles.profileImageSmall
                  ]}
                  resizeMode="cover"
                />
                <View style={styles.profileAvatarBorder} />
                <View style={[
                  styles.profileStatusDot,
                  isSmallScreen && styles.profileStatusDotSmall,
                  { backgroundColor: getCurrentModeInfo().color }
                ]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Door Control Section - Separate from glass controls */}
          <View style={styles.doorControlSection}>
            {/* Open Door Button */}
            <TouchableOpacity 
              style={[
                styles.openDoorButton, 
                isDoorLoading && styles.openDoorButtonLoading,
                !isDoorOnline && styles.openDoorButtonLoading
              ]}
              onPress={handleOpenDoor}
              disabled={isDoorLoading || !isDoorOnline}
              activeOpacity={0.8}
            >
              <View style={styles.doorButtonContent}>
                {isDoorLoading ? (
                  <Animated.View style={styles.loadingSpinner}>
                    <Ionicons name="sync" size={28} color={colors.card} />
                  </Animated.View>
                ) : (
                  <Ionicons name="key" size={28} color={colors.card} />
                )}
                <Text style={styles.doorButtonText}>
                  {isDoorLoading
                    ? 'Opening...'
                    : !isDoorOnline
                      ? 'Open Door (Offline)'
                      : 'Open Door'
                  }
                </Text>
              </View>
            </TouchableOpacity>

            {/* Door Status Card */}
            <BlurView intensity={90} tint="dark" style={styles.doorStatusCard}>
              <View style={styles.doorStatusHeader}>
                <View style={styles.doorStatusIndicator}>
                  <View style={[styles.doorStatusDot, { backgroundColor: getDoorStatusColor() }]} />
                  <Text style={styles.doorStatusText}>
                    {doorPing ? getDoorStatusText() : 'Offline'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.doorStatusContent}>
                {/* Always show labels, show values only if loaded */}
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Ping:</Text>
                  <Text style={styles.statusValue}>
                    {doorPing ? getFormattedPing(doorPing.ping) + 'ms' : '--'}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Temperature:</Text>
                  <Text style={styles.statusValue}>
                    {doorEnvironment ? (doorEnvironment.temperature || 'N/A') + '°C' : '--'}
                  </Text>
                </View>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Humidity:</Text>
                  <Text style={styles.statusValue}>
                    {doorEnvironment ? getFormattedHumidity(doorEnvironment.humidity) + '%' : '--'}
                  </Text>
                </View>
                {/* Last Action only if doorStatus exists */}
                {doorStatus && (
                  <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>Last Action:</Text>
                    <Text style={[styles.statusValue, { color: doorStatus.error ? colors.danger : colors.success }]}>
                      {doorStatus.error || 'Door opened successfully'}
                    </Text>
                  </View>
                )}
              </View>
            </BlurView>
          </View>

          {/* Greeting overlay */}
          <View style={styles.greetingOverlay}>
            <Text style={styles.greetingText}>{getTimeBasedGreeting()},</Text>
            <Text style={styles.userNameText}>
              {getFormattedUserName(currentUser?.username)}
            </Text>
          </View>
        </View>

        {/* Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="none"
          onRequestClose={toggleDropdown}
        >
          <Pressable style={styles.modalOverlay} onPress={toggleDropdown}>
            <Animated.View style={[
              styles.dropdownContainer,
              Platform.OS === 'web' && styles.dropdownContainerWeb,
              {
                opacity: dropdownAnimation,
                transform: [
                  { translateY: dropdownAnimation.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
                  { scale: dropdownAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }
                ]
              }
            ]}>
              {/* Header */}
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>User Status</Text>
                <TouchableOpacity onPress={toggleDropdown} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              {/* Connection Modes */}
              <View style={styles.modesContainer}>
                {Object.entries(CONNECTION_MODES).map(([key, mode]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.modeItem,
                      selectedMode === key && styles.selectedModeItem
                    ]}
                    onPress={() => handleModeSelect(key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modeIconContainer, { backgroundColor: mode.bgColor }]}>
                      <Ionicons name={mode.icon} size={18} color={mode.color} />
                    </View>
                    <View style={styles.modeContent}>
                      <Text style={[styles.modeTitle, { color: mode.color }]}>{mode.title}</Text>
                      <Text style={styles.modeSubtitle}>{mode.subtitle}</Text>
                    </View>
                    {selectedMode === key && (
                      <Ionicons name="checkmark-circle" size={20} color={mode.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.dropdownDivider} />
              {/* Logout Button */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
                <View style={styles.logoutIconContainer}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </View>
                <Text style={styles.logoutText}>Logout</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.danger} />
              </TouchableOpacity>
            </Animated.View>
          </Pressable>
        </Modal>

        <Animated.View style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={styles.dashboardContainer}>
            {/* Events Section - Pass parties data */}
            <EventsSection 
              navigation={navigation} 
              parties={allParties} 
              isLoading={isPartiesLoading}
            />
            
            {/* House Plan Section showing occupied rooms */}
            <Animated.View style={[
              styles.housePlanSection,
              { 
                opacity: housePlanAnimation, 
                transform: [{ 
                  translateY: housePlanAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  }) 
                }] 
              }
            ]}>
              <View style={styles.housePlanHeader}>
                <View style={styles.housePlanHeaderLeft}>
                  <Ionicons name="home" size={24} color={colors.primary} />
                  <View style={styles.housePlanHeaderTextGroup}>
                    <Text style={styles.housePlanHeaderTitle}>House Status</Text>
                    <Text style={styles.housePlanHeaderSubtitle}>
                      {occupiedRooms.length > 0 
                        ? `${occupiedRooms.length} room${occupiedRooms.length > 1 ? 's' : ''} occupied`
                        : 'All rooms available'}
                    </Text>
                  </View>
                </View>
                
                {/* Room color legend */}
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                    <Text style={styles.legendText}>Occupied</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: '#f8f9fa' }]} />
                    <Text style={styles.legendText}>Available</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.housePlanContainer}>
               <HousePlanSelector 
                viewOnly={true}
                selectedRooms={occupiedRooms}
                multiSelect={true}
              />

              </View>
            </Animated.View>

            {/* Random Facts Card */}
            <View style={styles.factsCard}>
              <View style={styles.factsHeader}>
                <View style={styles.factsIconContainer}>
                  <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.factsTitle}>Did You Know?</Text>
                <View style={styles.factsRefreshIndicator}>
                  {isFactLoading && (
                    <Ionicons name="sync" size={16} color={colors.textSecondary} />
                  )}
                </View>
              </View>
              <Animated.View style={[styles.factsContent, { opacity: factOpacity }]}>
                <Text style={styles.factsText}>{currentFact}</Text>
              </Animated.View>
              <View style={styles.factsFooter}>
                <Text style={styles.factsFooterText}>Updates every 15 seconds</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <BottomNavBar navigation={navigation} active="Home" />
    </View>
  );
};

const glassBackground = Platform.OS === 'ios'
  ? { backgroundColor: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(60px)' }  
  : Platform.OS === 'web'
    ? { backgroundColor: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(14px)' }
    : { backgroundColor: 'rgba(255,255,255,0.32)', backdropFilter: 'blur(60px)' };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  imageContainer: {
    width: '100%',
    height: 600,
    position: 'relative',
    justifyContent: 'center',
  },
  timeImage: {
    width: '100%',
    height: 600,
  },
  imageFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  
  glassControlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 32,
    right: 24,
    zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 30,
    paddingHorizontal: spacing.small,
    paddingVertical: 5,
    gap: spacing.small,
    ...glassBackground,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)', border: `1.5px solid ${colors.border}` },
    }),
  },
  glassItem: {
    marginHorizontal: 2,
  },
  glassButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'rgba(20,20,20,0.15)',
  },
  profileContainer: {
    position: 'relative',
  },
  profileAvatarGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 30,
    backgroundColor: `${colors.primary}20`,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 0,
  },
  profileImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 1,
  },
  profileImageSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  profileAvatarBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.6,
    zIndex: 2,
  },
  profileStatusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 3,
  },
  profileStatusDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    zIndex: 2,
    borderWidth: 2,
    borderColor: colors.card,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },

  doorControlSection: {
    position: 'absolute',
    bottom: 130,
    left: 24,
    right: 24,
    alignItems: 'center',
    zIndex: 10,
  },
  
  openDoorButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.large,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 200,
  },
  openDoorButtonLoading: {
    backgroundColor: colors.textSecondary,
  },
  doorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
  },
  doorButtonText: {
    color: colors.card,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Montserrat, System',
  },

  doorStatusCard: {
    borderRadius: borderRadius.medium,
    marginTop: spacing.xxlarge,
    padding: spacing.medium,
    width: '100%',
    maxWidth: 350,
    backgroundColor: 'rgba(20,20,20,0.07)',
    borderWidth: Platform.OS === 'ios' ? 1 : 0.5,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.3)' : colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.2,
    shadowRadius: Platform.OS === 'ios' ? 20 : 16,
    elevation: Platform.OS === 'android' ? 12 : 8,
  },
  doorStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.small,
  },
  doorStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  doorStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  doorStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  doorStatusContent: {
    gap: spacing.small,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },

  greetingOverlay: {
    position: 'absolute',
    top: 40,
    left: 20,
    paddingHorizontal: spacing.medium,
  },
  greetingText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'light',
    fontFamily: 'Montserrat, System',
  },
  userNameText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: '900',
    fontFamily: 'Montserrat, System',
    flexWrap: 'wrap',
    lineHeight: 54,
  },
  contentContainer: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 20 : 30, 
    paddingBottom: 100,
  },

  housePlanSection: {
    marginHorizontal: spacing.large,
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' },
    }),
  },
  housePlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.large,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  housePlanHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  housePlanHeaderTextGroup: {
    marginLeft: spacing.small,
  },
  housePlanHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  housePlanHeaderSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  housePlanContainer: {
    height: 280,
    backgroundColor: '#f1f3f5',
    overflow: 'hidden',
  },

  factsCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginHorizontal: spacing.large,
    marginTop: spacing.xlarge,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  factsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  factsIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.small,
  },
  factsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  factsRefreshIndicator: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  factsContent: {
    marginBottom: spacing.small,
  },
  factsText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  factsFooter: {
    alignItems: 'center',
  },
  factsFooterText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: Platform.OS === 'web' ? 'flex-end' : 'flex-end',
    paddingTop: Platform.OS === 'android' ? 80 : 95,
    paddingRight: spacing.large,
  },
  dropdownContainer: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
  },
  dropdownContainerWeb: {
    position: 'absolute',
    top: 100, 
    right: 520, 
    zIndex: 1001,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: `${colors.primary}05`,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modesContainer: {
    paddingVertical: spacing.small,
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: 0,
  },
  selectedModeItem: {
    backgroundColor: `${colors.primary}08`,
  },
  modeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  modeSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    backgroundColor: `${colors.danger}08`,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.danger}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.danger,
  },
});

export default HomeScreen;
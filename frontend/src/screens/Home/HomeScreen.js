import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Platform, StatusBar, Animated, Image, Text, TouchableOpacity, Modal, Pressable, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import BottomNavBar from '../../components/BottomNavBar';
import EventsSection from '../../components/PartyEventsCarousel';
import { hasUnreadNotifications } from '../../services/notificationService';
import { openDoor, getDoorPing, getDoorEnvironment } from '../../services/doorService';
import { getParties } from '../../services/partyService';
import { CONNECTION_MODES } from '../../constants/users';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../context/ThemeContext';
import { useColors } from '../../hooks/useColors';
import HousePlanSelector from '../../components/HousePlanSelector';
import Message from '../../components/Message';
import { useFocusEffect } from '@react-navigation/native';

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
  const { isDarkMode, toggleTheme } = useTheme();
  const colors = useColors();

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

  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Check if user is a guest
  const isGuest = currentUser?.type === 'GUEST';

  // Check if guest can open door (invited to an active party)
  const canGuestOpenDoor = () => {
    if (!isGuest) return true;
    
    const now = new Date();
    return allParties.some(party => {
      if (party.status !== 'IN_PROGRESS') return false;
      
      const partyStart = new Date(party.dateTime);
      const partyEnd = new Date(party.endDateTime || party.dateTime);
      
      // Check if party is currently active and user is invited
      const isPartyActive = now >= partyStart && now <= partyEnd;
      const isUserInvited = party.guests && party.guests.some(guest => 
        guest.user.id === currentUser?.id
      );
      
      console.log(`Party ${party.id} active: ${isPartyActive}, invited: ${isUserInvited}`);
      return isPartyActive && isUserInvited;
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      if (!isGuest || (isGuest && canGuestOpenDoor())) {
        fetchDoorData();
      }
      fetchRandomFact();
      fetchPartyData();

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      ]).start();

      // Set up fact refresh interval (15 seconds)
      const factInterval = setInterval(fetchRandomFact, 15000);
      
      // Set up door data refresh interval (30 seconds)
      let doorInterval;
      if (!isGuest || (isGuest && canGuestOpenDoor())) {
        doorInterval = setInterval(fetchDoorData, 30000);
      }

      // Set up party data refresh interval (30 seconds)
      const partiesInterval = setInterval(fetchPartyData, 30000);

      return () => {
        clearInterval(factInterval);
        if (doorInterval) clearInterval(doorInterval);
        clearInterval(partiesInterval);
      };
    }, [isGuest, canGuestOpenDoor()])
  );

  useEffect(() => {
    if (!isGuest) {
      Animated.timing(housePlanAnimation, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    }
  }, [isGuest, allParties]);

  const fetchDoorData = async () => {
    // Só não faz requests se for guest sem acesso
    if (isGuest && !canGuestOpenDoor()) return;
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
      await openDoor();
      setMessage('Door opened successfully!');
      setMessageType('success');
      if (!isGuest) {
        setTimeout(fetchDoorData, 1000);
      }
    } catch (error) {
      setMessage('Failed to open door');
      setMessageType('error');
      console.log('Error opening door:', error);
    } finally {
      setIsDoorLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let intervalId;
      const fetchUnread = () => {
        hasUnreadNotifications()
          .then(setHasUnreadNotificationsState)
          .catch(() => setHasUnreadNotificationsState(false));
      };
      fetchUnread();
      intervalId = setInterval(fetchUnread, 30000);
      return () => clearInterval(intervalId);
    }, [])
  );

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
    const promises = [
      fetchRandomFact(),
      fetchPartyData()
    ];
  
    if (!isGuest || (isGuest && canGuestOpenDoor())) {
      promises.push(fetchDoorData());
    }
    Promise.all(promises).finally(() => {
      setRefreshing(false);
    });
  }, [isGuest, canGuestOpenDoor]);

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
  const canOpenDoor = !isGuest ? isDoorOnline : canGuestOpenDoor();

  const getGlassBackground = () => {
    if (Platform.OS === 'ios') {
      return {
        backgroundColor: isDarkMode ? 'rgba(40,45,65,0.65)' : 'rgba(255,255,255,0.32)',
        backdropFilter: 'blur(60px)'
      };
    } else if (Platform.OS === 'web') {
      return {
        backgroundColor: isDarkMode ? 'rgba(40,45,65,0.55)' : 'rgba(255,255,255,0.18)',
        backdropFilter: 'blur(14px)'
      };
    } else {
      return {
        backgroundColor: isDarkMode ? 'rgba(40,45,65,0.65)' : 'rgba(255,255,255,0.32)',
        backdropFilter: 'blur(60px)'
      };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* Scrollable with refresh */}
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
          <LinearGradient 
            colors={['transparent', colors.background]} 
            style={styles.imageFade} 
            start={{ x: 0.5, y: 0.6 }} 
            end={{ x: 0.5, y: 1 }} 
          />

          {/* Glass Controls (notifications, profile, etc.) */}
          <View style={[styles.glassControlsContainer, getGlassBackground()]}>
            {/* Dark Mode Button */}
            <View style={styles.glassItem}>
              <TouchableOpacity 
                style={[
                  styles.glassButton, 
                  { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(20,20,20,0.15)' }
                ]} 
                activeOpacity={0.7}
                onPress={toggleTheme}
              >
                <Ionicons 
                  name={isDarkMode ? "sunny-outline" : "moon-outline"} 
                  size={isSmallScreen ? 16 : 22} 
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            {/* Notification Button */}
            <View style={styles.glassItem}>
              <TouchableOpacity 
                style={[
                  styles.glassButton, 
                  { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(20,20,20,0.15)' }
                ]} 
                activeOpacity={0.7} 
                onPress={handleNotificationsPress}
              >
                <Ionicons name="notifications-outline" size={isSmallScreen ? 16 : 22} color="#fff" />
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
                  source={getAvatarSource(currentUser?.type)}
                  style={[
                    styles.profileImage,
                    isSmallScreen && styles.profileImageSmall
                  ]}
                  resizeMode="cover"
                />
                <View style={[
                  styles.profileAvatarBorder,
                  { borderColor: colors.primary }
                ]} />
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
                { backgroundColor: colors.primary },
                (isDoorLoading || !canOpenDoor) && [
                  styles.openDoorButtonLoading,
                  { backgroundColor: colors.textSecondary }
                ]
              ]}
              onPress={handleOpenDoor}
              disabled={isDoorLoading || !canOpenDoor}
              activeOpacity={0.8}
            >
              <View style={styles.doorButtonContent}>
                {isDoorLoading ? (
                  <Animated.View style={styles.loadingSpinner}>
                    <Ionicons name="sync" size={28} color="#fff" />
                  </Animated.View>
                ) : (
                  <Ionicons name="key" size={28} color="#fff" />
                )}
                <Text style={[styles.doorButtonText, { color: "#fff" }]}>
                  {isDoorLoading
                    ? 'Opening...'
                    : isGuest
                      ? canGuestOpenDoor()
                        ? 'Open Door'
                        : 'Open Door (Not Available)'
                      : !isDoorOnline
                        ? 'Open Door (Offline)'
                        : 'Open Door'
                  }
                </Text>
              </View>
            </TouchableOpacity>

            {/* Door Status Card */}
            <BlurView 
              intensity={90} 
              tint={isDarkMode ? "dark" : "dark"} 
              style={styles.doorStatusCard}
            >
              {(isGuest && !canGuestOpenDoor()) ? (
                <View style={styles.guestMessageContainer}>
                  <View style={styles.guestMessageHeader}>
                    <Ionicons name="information-circle" size={24} color={colors.warning} />
                    <Text style={[styles.guestMessageTitle, { color: "#fff" }]}>Guest Access</Text>
                  </View>
                  <Text style={[styles.guestMessageText, { color: "#fff" }]}>
                    As a guest, you can only open the door when you're invited to an active party. 
                    Once the party ends, door access will be restricted until you're invited to another event.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.doorStatusHeader}>
                    <View style={styles.doorStatusIndicator}>
                      <View style={[styles.doorStatusDot, { backgroundColor: getDoorStatusColor() }]} />
                      <Text style={[styles.doorStatusText, { color: "#fff" }]}>
                        {doorPing ? getDoorStatusText() : 'Offline'}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.doorStatusContent}>
                    {/* Always show labels, show values only if loaded */}
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusLabel, { color: "#fff" }]}>Ping:</Text>
                      <Text style={[styles.statusValue, { color: "#fff" }]}>
                        {doorPing ? getFormattedPing(doorPing.ping) + 'ms' : '--'}
                      </Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusLabel, { color: "#fff" }]}>Temperature:</Text>
                      <Text style={[styles.statusValue, { color: "#fff" }]}>
                        {doorEnvironment ? (doorEnvironment.temperature || 'N/A') + '°C' : '--'}
                      </Text>
                    </View>
                    <View style={styles.statusRow}>
                      <Text style={[styles.statusLabel, { color: "#fff" }]}>Humidity:</Text>
                      <Text style={[styles.statusValue, { color: "#fff" }]}>
                        {doorEnvironment ? getFormattedHumidity(doorEnvironment.humidity) + '%' : '--'}
                      </Text>
                    </View>
                  </View>
                </>
              )}
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
              { backgroundColor: colors.card },
              {
                opacity: dropdownAnimation,
                transform: [
                  { translateY: dropdownAnimation.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) },
                  { scale: dropdownAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }
                ]
              }
            ]}>
              {/* Header */}
              <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.dropdownTitle, { color: colors.textPrimary }]}>User Status</Text>
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
                      selectedMode === key && [
                        styles.selectedModeItem,
                        { backgroundColor: `${colors.primary}08` }
                      ]
                    ]}
                    onPress={() => handleModeSelect(key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.modeIconContainer, { backgroundColor: mode.bgColor }]}>
                      <Ionicons name={mode.icon} size={18} color={mode.color} />
                    </View>
                    <View style={styles.modeContent}>
                      <Text style={[styles.modeTitle, { color: mode.color }]}>{mode.title}</Text>
                      <Text style={[styles.modeSubtitle, { color: colors.textSecondary }]}>{mode.subtitle}</Text>
                    </View>
                    {selectedMode === key && (
                      <Ionicons name="checkmark-circle" size={20} color={mode.color} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />
              {/* Logout Button */}
              <TouchableOpacity 
                style={[
                  styles.logoutButton, 
                  { backgroundColor: `${colors.danger}08` }
                ]} 
                onPress={handleLogout} 
                activeOpacity={0.7}
              >
                <View style={[styles.logoutIconContainer, { backgroundColor: `${colors.danger}15` }]}>
                  <Ionicons name="log-out-outline" size={18} color={colors.danger} />
                </View>
                <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
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
              titleStyle={{
                color: isDarkMode ? "#fff" : colors.textPrimary
              }}
              subtitleStyle={{
                color: isDarkMode ? colors.textSecondary : colors.textSecondary
              }}
            />
            
            {/* House Plan Section showing occupied rooms */}
            {!isGuest && (
              <Animated.View style={[
                styles.housePlanSection,
                { backgroundColor: colors.card },
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
                <View style={[
                  styles.housePlanHeader, 
                  { borderBottomColor: colors.border }
                ]}>
                  <View style={styles.housePlanHeaderLeft}>
                    <Ionicons name="home" size={24} color={colors.primary} />
                    <View style={styles.housePlanHeaderTextGroup}>
                      <Text style={[styles.housePlanHeaderTitle, { color: colors.textPrimary }]}>House Status</Text>
                      <Text style={[styles.housePlanHeaderSubtitle, { color: colors.textSecondary }]}>
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
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Occupied</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: isDarkMode ? '#3C4252' : '#f8f9fa', borderColor: colors.border }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Available</Text>
                    </View>
                  </View>
                </View>
                
                <View style={[
                  styles.housePlanContainer, 
                  { backgroundColor: isDarkMode ? '#23283A' : '#f1f3f5' }
                ]}>
                  <HousePlanSelector 
                    viewOnly={true}
                    selectedRooms={occupiedRooms}
                    multiSelect={true}
                  />
                </View>
              </Animated.View>
            )}

            {/* Random Facts Card */}
            <View style={[
              styles.factsCard, 
              { 
                backgroundColor: colors.card,
                shadowColor: colors.shadow 
              }
            ]}>
              <View style={styles.factsHeader}>
                <View style={[styles.factsIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.factsTitle, { color: colors.textPrimary }]}>Did You Know?</Text>
                <View style={styles.factsRefreshIndicator}>
                  {isFactLoading && (
                    <Ionicons name="sync" size={16} color={colors.textSecondary} />
                  )}
                </View>
              </View>
              <Animated.View style={[styles.factsContent, { opacity: factOpacity }]}>
                <Text style={[styles.factsText, { color: colors.textSecondary }]}>{currentFact}</Text>
              </Animated.View>
              <View style={styles.factsFooter}>
                <Text style={[styles.factsFooterText, { color: colors.textSecondary }]}>Updates every 15 seconds</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Show message at the top */}
      <Message
        message={message}
        type={messageType}
        onDismiss={() => setMessage('')}
      />

      <BottomNavBar navigation={navigation} active="Home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 30,
    paddingHorizontal: spacing.small,
    paddingVertical: 5,
    gap: spacing.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    ...Platform.select({
      web: { backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.18)' },
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
    backgroundColor: `rgba(67, 97, 238, 0.2)`,
    shadowColor: '#4361EE',
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
    borderColor: '#FFFFFF',
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
    borderColor: '#FFFFFF',
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
    backgroundColor: '#EF4444',
    zIndex: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
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
    borderRadius: borderRadius.large,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 200,
  },
  doorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.small,
  },
  doorButtonText: {
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
    shadowColor: Platform.OS === 'ios' ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.2)',
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
    fontWeight: '500',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Guest message styles
  guestMessageContainer: {
    alignItems: 'center',
  },
  guestMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  guestMessageTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  guestMessageText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
  },
  guestActivePartyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginTop: spacing.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderRadius: borderRadius.small,
  },
  guestActivePartyText: {
    fontSize: 12,
    fontWeight: '600',
  },

  greetingOverlay: {
    position: 'absolute',
    top: 40,
    left: 15,
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
    borderRadius: borderRadius.large,
    overflow: 'hidden',
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
  },
  housePlanHeaderSubtitle: {
    fontSize: 13,
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
  },
  legendText: {
    fontSize: 12,
  },
  housePlanContainer: {
    height: 280,
    overflow: 'hidden',
  },

  factsCard: {
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    marginHorizontal: spacing.large,
    marginTop: spacing.xlarge,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.small,
  },
  factsTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
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
  },
  factsFooter: {
    alignItems: 'center',
  },
  factsFooterText: {
    fontSize: 12,
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
    borderRadius: borderRadius.large,
    minWidth: 280,
    maxWidth: 320,
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
    backgroundColor: 'rgba(67, 97, 238, 0.05)',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  dropdownDivider: {
    height: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  logoutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  logoutText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  loadingSpinner: {
    // For the door opening spinner animation
  },
});

export default HomeScreen;
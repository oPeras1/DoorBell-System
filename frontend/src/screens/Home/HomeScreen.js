import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { getCurrentUser } from '../../services/auth';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Message from '../../components/Message';

const DUMMY_ACTIVITIES = [
  { id: 1, time: '10:30 AM', date: 'Today', action: 'Door Bell Ring', user: 'Guest' },
  { id: 2, time: '03:15 PM', date: 'Yesterday', action: 'Door Opened', user: 'John Doe' },
  { id: 3, time: '09:45 AM', date: 'Yesterday', action: 'Door Bell Ring', user: 'Delivery' },
  { id: 4, time: '06:20 PM', date: '22/03/2025', action: 'Door Bell Ring', user: 'Unknown' },
];

const getUserTypeInfo = (type) => {
  switch (type) {
    case 'GUEST':
      return {
        icon: 'person-outline',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        title: 'Guest',
        subtitle: 'Limited Access'
      };
    case 'HOUSER':
      return {
        icon: 'home',
        color: '#059669',
        bgColor: '#ECFDF5',
        title: 'Houser',
        subtitle: 'Resident Access'
      };
    case 'KNOWLEDGER':
      return {
        icon: 'shield-checkmark',
        color: '#7C3AED',
        bgColor: '#F3E8FF',
        title: 'Knowledger',
        subtitle: 'Full Access'
      };
    default:
      return {
        icon: 'person',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        title: 'User',
        subtitle: 'Standard Access'
      };
  }
};

const HomeScreen = ({ navigation }) => {
  const { logout, user, setUser } = useContext(AuthContext);
  const [isRinging, setIsRinging] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [randomFact, setRandomFact] = useState('');
  const [isLoadingFact, setIsLoadingFact] = useState(false);
  const [refreshAnimation] = useState(new Animated.Value(0));
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [factOpacity] = useState(new Animated.Value(1));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  
  // Anti-spam protection states
  const [refreshClickCount, setRefreshClickCount] = useState(0);
  const [showSpamMessage, setShowSpamMessage] = useState(false);
  const [isRefreshDisabled, setIsRefreshDisabled] = useState(false);
  
  // Refs for intervals and timeouts
  const factIntervalRef = useRef(null);
  const spamTimeoutRef = useRef(null);
  const refreshCooldownRef = useRef(null);

  useEffect(() => {
    fetchUserData();
    fetchRandomFact();
    
    // Enhanced entrance animation with fade and slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();
    
    // Pulse animation for connection status
    const createPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.3,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };
    
    createPulseAnimation();
    
    // Update current time every minute for accurate greeting
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timeInterval);
      // Clean up all refs on unmount
      if (factIntervalRef.current) clearInterval(factIntervalRef.current);
      if (spamTimeoutRef.current) clearTimeout(spamTimeoutRef.current);
      if (refreshCooldownRef.current) clearTimeout(refreshCooldownRef.current);
    };
  }, []);

  useEffect(() => {
    // Clear existing interval
    if (factIntervalRef.current) {
      clearInterval(factIntervalRef.current);
    }
    
    if (autoRefresh) {
      factIntervalRef.current = setInterval(fetchRandomFact, 15000);
    }

    return () => {
      if (factIntervalRef.current) clearInterval(factIntervalRef.current);
    };
  }, [autoRefresh]);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    
    // Sunrise typically around 6-7 AM, sunset around 6-8 PM (approximation)
    if (hour >= 6 && hour < 12) {
      return '🌅 Good Morning';
    } else if (hour >= 12 && hour < 18) {
      return '☀️ Good Afternoon';
    } else {
      return '🌙 Good Evening';
    }
  };

  const fetchUserData = async () => {
    try {
      setIsLoadingUser(true);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      // Check if it's a 404 error (user not authenticated)
      if (error.response && error.response.status === 404) {
        console.log('User not authenticated, redirecting to login...');
        // Force logout to clear any invalid tokens
        await logout();
        return;
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchRandomFact = async () => {
    try {
      setIsLoadingFact(true);
      
      // Start rotation animation
      Animated.loop(
        Animated.timing(refreshAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        })
      ).start();

      // Fade out current text if not first load
      if (!isFirstLoad) {
        Animated.timing(factOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }

      let factText = '';
      let attempts = 0;
      
      // Keep fetching until we get a fact with 150 characters or less
      do {
        attempts++;
        try {
          const response = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
          const data = await response.json();
          factText = data.text.trim();
        } catch (fetchError) {
          // If API fails, break and use fallback
          console.log(`Fetch attempt ${attempts} failed:`, fetchError);
          factText = 'Você sabia que o QR Code foi inventado no Japão em 1994?';
          break;
        }
      } while (factText.length > 150);

      setTimeout(() => {
        setRandomFact(factText);
        if (!isFirstLoad) {
          // Fade in new text
          Animated.timing(factOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
        if (isFirstLoad) setIsFirstLoad(false);
      }, isFirstLoad ? 0 : 200);
      
    } catch (error) {
      setTimeout(() => {
        setRandomFact('Você sabia que o QR Code foi inventado no Japão em 1994?');
        if (!isFirstLoad) {
          Animated.timing(factOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
        if (isFirstLoad) setIsFirstLoad(false);
      }, isFirstLoad ? 0 : 200);
    } finally {
      setIsLoadingFact(false);
      refreshAnimation.stopAnimation();
      refreshAnimation.setValue(0);
    }
  };

  const handleManualRefresh = () => {
    // Check if refresh is disabled due to spam protection
    if (isRefreshDisabled) {
      return;
    }

    // Increment click count for spam detection
    setRefreshClickCount(prev => {
      const newCount = prev + 1;
      
      // Check for spam (more than 10 clicks)
      if (newCount >= 10) {
        setShowSpamMessage(true);
        setIsRefreshDisabled(true);
        
        // Reset spam protection after 5 seconds
        refreshCooldownRef.current = setTimeout(() => {
          setIsRefreshDisabled(false);
          setRefreshClickCount(0);
        }, 5000);
        
        return newCount;
      }
      
      return newCount;
    });

    // Reset click count after 2 seconds of no clicks
    if (spamTimeoutRef.current) {
      clearTimeout(spamTimeoutRef.current);
    }
    
    spamTimeoutRef.current = setTimeout(() => {
      setRefreshClickCount(0);
    }, 2000);

    // Reset the auto-refresh timer by clearing and restarting the interval
    if (autoRefresh && factIntervalRef.current) {
      clearInterval(factIntervalRef.current);
      factIntervalRef.current = setInterval(fetchRandomFact, 15000);
    }

    // Fetch new fact
    fetchRandomFact();
  };

  const dismissSpamMessage = () => {
    setShowSpamMessage(false);
  };

  const handleRingDoorbell = () => {
    setIsRinging(true);
    
    setTimeout(() => {
      setIsRinging(false);
    }, 3000);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const renderActivityItem = (item) => (
    <View key={item.id} style={styles.activityItem}>
      <View style={styles.activityIconContainer}>
        <Ionicons 
          name={item.action.includes('Ring') ? 'notifications' : 'lock-open'} 
          size={22} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityAction}>{item.action}</Text>
        <Text style={styles.activityUser}>{item.user}</Text>
      </View>
      <View style={styles.activityTime}>
        <Text style={styles.activityTimeText}>{item.time}</Text>
        <Text style={styles.activityDateText}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Spam protection message */}
      <Message 
        message={showSpamMessage ? "Slow down! You are going too fast!" : null}
        onDismiss={dismissSpamMessage}
        type="error"
      />
      
      <Animated.View style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <Animated.View style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.headerGradient}>
            {/* Decorative elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativePattern} />
            
            <View style={styles.headerContent}>
              <View style={styles.mainSection}>
                <View style={styles.greetingContainer}>
                  <View style={styles.greetingRow}>
                    <Text style={styles.timeGreeting}>
                      {getTimeBasedGreeting()}
                    </Text>
                    <View style={styles.greetingAccent} />
                  </View>
                  <Text style={styles.usernameDisplay}>{user?.username || 'User'}</Text>
                </View>
                
                {user?.type && (
                  <View style={[styles.accessBadge, { backgroundColor: getUserTypeInfo(user.type).bgColor }]}>
                    <View style={[styles.accessIconContainer, { backgroundColor: getUserTypeInfo(user.type).color }]}>
                      <Ionicons 
                        name={getUserTypeInfo(user.type).icon} 
                        size={14} 
                        color="white" 
                      />
                    </View>
                    <View style={styles.accessText}>
                      <Text style={[styles.accessTitle, { color: getUserTypeInfo(user.type).color }]}>
                        {getUserTypeInfo(user.type).title}
                      </Text>
                      <Text style={[styles.accessSubtitle, { color: getUserTypeInfo(user.type).color }]}>
                        {getUserTypeInfo(user.type).subtitle}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              
              <View style={styles.profileSection}>
                <View style={styles.connectionStatus}>
                  <Animated.View style={[styles.statusIndicator, {
                    transform: [{ scale: pulseAnimation }]
                  }]}>
                    <View style={styles.statusPulse} />
                  </Animated.View>
                  <Text style={styles.connectionText}>Connected</Text>
                </View>
                <TouchableOpacity style={styles.avatarContainer}>
                  <View style={styles.avatarGlow} />
                  <Image 
                    source={require('../../../assets/avatar.png')} 
                    style={styles.avatarImage} 
                  />
                  <View style={styles.avatarBorder} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Enhanced Random Fact Section */}
            <View style={styles.factSection}>
              <View style={styles.factBackground} />
              <View style={styles.factHeader}>
                <View style={styles.factIconContainer}>
                  <Ionicons name="bulb" size={16} color={colors.primary} />
                </View>
                <Text style={styles.factTitle}>Did You Know?</Text>
                <View style={styles.factControls}>
                  <TouchableOpacity onPress={toggleAutoRefresh} style={styles.autoRefreshIndicator}>
                    <View style={[styles.autoRefreshDot, { 
                      backgroundColor: autoRefresh ? colors.secondary : colors.textSecondary 
                    }]} />
                    <Text style={[styles.autoRefreshText, { 
                      color: autoRefresh ? colors.secondary : colors.textSecondary 
                    }]}>
                      {autoRefresh ? '15s' : 'OFF'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleManualRefresh} style={[
                    styles.refreshButton,
                    isRefreshDisabled && styles.refreshButtonDisabled
                  ]} disabled={isLoadingFact || isRefreshDisabled}>
                    <Animated.View style={{
                      transform: [{
                        rotate: refreshAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg']
                        })
                      }]
                    }}>
                      <Ionicons 
                        name="refresh" 
                        size={14} 
                        color={isLoadingFact || isRefreshDisabled ? colors.textSecondary : colors.primary}
                      />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              </View>
              <Animated.View style={{ opacity: factOpacity }}>
                <Text style={styles.factText} numberOfLines={3}>
                  {isFirstLoad && isLoadingFact ? 'Loading interesting fact...' : randomFact}
                </Text>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.doorbellContainer}>
            <Button 
              title={isRinging ? "Ringing..." : "Ring Doorbell"} 
              onPress={handleRingDoorbell}
              loading={isRinging}
              disabled={isRinging}
              iconLeft={!isRinging && <Ionicons name="notifications" size={22} color="white" />}
            />
          </View>
          
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              {DUMMY_ACTIVITIES.map(renderActivityItem)}
            </View>
            
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Activity</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.primary }]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem} 
            onPress={() => navigation.navigate('Users')}
          >
            <Ionicons name="people-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    marginHorizontal: spacing.large,
    marginTop: spacing.medium,
    marginBottom: spacing.medium,
  },
  headerGradient: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xlarge || 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}08`,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${colors.secondary}06`,
  },
  decorativePattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: 4,
    background: `linear-gradient(90deg, ${colors.primary}20, ${colors.secondary}20)`,
    backgroundColor: `${colors.primary}15`,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.large,
  },
  mainSection: {
    flex: 1,
    marginRight: spacing.medium,
  },
  greetingContainer: {
    marginBottom: spacing.medium,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  greetingAccent: {
    width: 20,
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginLeft: 8,
    opacity: 0.7,
  },
  timeGreeting: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  usernameDisplay: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accessIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  accessText: {
    marginLeft: 8,
  },
  accessTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  accessSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: 1,
  },
  profileSection: {
    alignItems: 'flex-end',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.success}25`,
  },
  statusIndicator: {
    position: 'relative',
    marginRight: 6,
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  connectionText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarGlow: {
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
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: colors.card,
  },
  avatarBorder: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: colors.primary,
    opacity: 0.6,
  },
  factSection: {
    marginTop: spacing.medium,
    paddingTop: spacing.large,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.large,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}50`,
    position: 'relative',
    minHeight: 120, // Fixed height to prevent layout shifts
  },
  factBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: `${colors.primary}03`,
    borderBottomLeftRadius: borderRadius.xlarge || 24,
    borderBottomRightRadius: borderRadius.xlarge || 24,
  },
  factHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    zIndex: 1,
  },
  factIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  factTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.4,
    flex: 1,
  },
  factControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoRefreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.secondary}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  autoRefreshDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
    marginRight: 4,
  },
  autoRefreshText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.secondary,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: `${colors.primary}15`,
  },
  refreshButtonDisabled: {
    backgroundColor: colors.background,
    borderColor: `${colors.textSecondary}15`,
    opacity: 0.5,
  },
  factText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'left',
    zIndex: 1,
    height: 60, // Fixed height for exactly 3 lines (20 * 3)
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 80 : 95,
    paddingHorizontal: spacing.large,
    paddingBottom: 90,
  },
  doorbellContainer: {
    marginVertical: spacing.large,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  activityContainer: {
    marginTop: spacing.medium,
  },
  activityList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  activityUser: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    alignItems: 'flex-end',
  },
  activityTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  activityDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.medium,
    padding: spacing.medium,
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.small,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  }
});

export default HomeScreen;
import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Image,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getAllUsers } from '../../services/userService';
import Message from '../../components/Message';
import TopField from '../../components/TopField';
import { LinearGradient } from 'expo-linear-gradient';
import InputField from '../../components/InputField';

const USER_TYPE_INFO = {
  KNOWLEDGER: {
    icon: 'shield-checkmark',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    borderColor: '#A855F7',
    title: 'Knowledger',
    subtitle: 'Full Access',
    priority: 1,
    gradient: ['#8B5CF6', '#7C3AED'],
    description: 'Complete system control',
    cardBg: '#f5f3ff',
  },
  HOUSER: {
    icon: 'home',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#10B981',
    title: 'Houser',
    subtitle: 'Resident Access',
    priority: 2,
    gradient: ['#10B981', '#059669'],
    description: 'Home management access',
    cardBg: '#e6fcf5',
  },
  GUEST: {
    icon: 'person-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    title: 'Guest',
    subtitle: 'Limited Access',
    priority: 3,
    gradient: ['#9CA3AF', '#6B7280'],
    description: 'Basic visitor access',
    cardBg: '#f3f4f6',
  }
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const UsersScreen = ({ navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  useEffect(() => {
    fetchUsers();
    
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
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const usersData = await getAllUsers();
      
      const sortedUsers = usersData.sort((a, b) => {
        const priorityA = USER_TYPE_INFO[a.type]?.priority || 999;
        const priorityB = USER_TYPE_INFO[b.type]?.priority || 999;
        
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.username.localeCompare(b.username);
      });
      
      setUsers(sortedUsers);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('User not authenticated, redirecting to login...');
        await logout();
        return;
      }
      
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const dismissError = () => setError(null);

  const getUserTypeInfo = (type) => USER_TYPE_INFO[type] || USER_TYPE_INFO.GUEST;

  const getAvatarSource = (userType) => {
    if (userType === 'KNOWLEDGER') {
      return require('../../../assets/avatarknowledger.jpg');
    }
    if (userType === 'HOUSER') {
      return require('../../../assets/avatarhouser.png');
    }
    return require('../../../assets/avatarguest.jpeg');
  };

  const renderUserCard = (user, index, arr) => {
    const userInfo = getUserTypeInfo(user.type);
    const isCurrentUser = user.username === currentUser?.username;
    const isKnowledger = currentUser?.type === 'KNOWLEDGER';

    return (
      <AnimatedTouchable
        key={user.username}
        style={[
          styles.userCard,
          isCurrentUser && styles.currentUserCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30 + (index * 5), 0]
              })
            }],
            marginBottom: index < arr.length - 1 ? spacing.medium : 0,
          }
        ]}
        activeOpacity={0.95}
        onPress={() => {
          // Add haptic feedback or navigation
        }}
      >
        <LinearGradient
          colors={[`${userInfo.color}1A`, `${userInfo.color}0D`]}
          style={styles.userCardGradient}
        >
          <View style={styles.userCardContent}>
            <View style={styles.userLeftSection}>
              <View style={styles.userAvatar}>
                <Image
                  source={getAvatarSource(user.type)}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    borderWidth: 2,
                    borderColor: userInfo.color,
                    backgroundColor: userInfo.bgColor,
                  }}
                  resizeMode="cover"
                />
                <View style={[styles.userGlow, { backgroundColor: `${userInfo.color}20` }]} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.username}</Text>
                <View style={[styles.userTypeBadge, { backgroundColor: userInfo.bgColor }]}>
                  <Ionicons name={userInfo.icon} size={12} color={userInfo.color} />
                  <Text style={[styles.userTypeText, { color: userInfo.color }]}>
                    {userInfo.title}
                  </Text>
                </View>
                {isCurrentUser && <Text style={styles.userDescription}>(You)</Text>}
              </View>
            </View>
            <View style={styles.userRightSection}>
              {isKnowledger && !isCurrentUser && (
                <TouchableOpacity 
                  style={[styles.userActionButton, { borderColor: `${userInfo.color}80`, backgroundColor: `${userInfo.color}15` }]}
                  onPress={() => {
                    // Add user action
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color={userInfo.color} />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={[styles.userCardAccent, { backgroundColor: userInfo.color }]} />
        </LinearGradient>
      </AnimatedTouchable>
    );
  };

  const normalizeString = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/\s+/g, '') // remove spaces
      .toLowerCase();
  };

  const getUsersByRole = () => {
    const usersByRole = {
      KNOWLEDGER: [],
      HOUSER: [],
      GUEST: []
    };
    users
      .filter(user => {
        if (!userSearch) return true;
        return normalizeString(user.username).includes(normalizeString(userSearch));
      })
      .forEach(user => {
        const role = user.type || 'GUEST';
        if (usersByRole[role]) {
          usersByRole[role].push(user);
        }
      });
    return usersByRole;
  };

  const renderRoleSection = (roleType, roleUsers, sectionIndex) => {
    if (roleUsers.length === 0) return null;

    const roleInfo = USER_TYPE_INFO[roleType];

    return (
      <Animated.View 
        key={roleType}
        style={[
          styles.roleSection,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50 + (sectionIndex * 20), 0]
              })
            }]
          }
        ]}
      >
        <View style={[
          styles.roleSectionCard,
          { borderLeftColor: roleInfo.color, borderLeftWidth: 4 },
          styles.roleSectionShadow // Adiciona shadow
        ]}>
          <View style={styles.roleSectionHeader}>
            <View style={styles.roleHeaderLeft}>
              <View style={[styles.roleIconContainer, { backgroundColor: roleInfo.color }]}>
                <Ionicons name={roleInfo.icon} size={20} color="white" />
              </View>
              <View style={styles.roleTitleContainer}>
                <Text style={[styles.roleTitle, { color: roleInfo.color }]}>{roleInfo.title}s</Text>
                <Text style={styles.roleSubtitle}>{roleInfo.subtitle}</Text>
              </View>
            </View>
            
            <View style={[styles.roleCountBadge, { backgroundColor: `${roleInfo.color}1A` }]}>
              <Text style={[styles.roleCountText, { color: roleInfo.color }]}>{roleUsers.length}</Text>
            </View>
          </View>
          
          <View style={styles.roleUsersList}>
            {roleUsers.map((user, index) => renderUserCard(user, index, roleUsers))}
          </View>
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <TopField 
          greeting={getTimeBasedGreeting()}
          userName={currentUser?.username}
          userType={currentUser?.type}
          isOnline={true}
          onProfilePress={() => {}}
          showDarkModeToggle={true}
          onLogout={logout}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
        
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Home')}
          >
            <Ionicons name="home-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="people" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.primary }]}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Party')}
          >
            <Ionicons name="calendar-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Party</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      <TopField 
        greeting={getTimeBasedGreeting()}
        userName={currentUser?.username}
        userType={currentUser?.type}
        isOnline={true}
        onProfilePress={() => {}}
        showDarkModeToggle={true}
        onLogout={logout}
      />

      <Message 
        message={error}
        onDismiss={dismissError}
        type="error"
      />
      
      <Animated.View style={[
        styles.contentContainer, 
        { 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
              progressViewOffset={Platform.OS === 'android' ? 80 : 95}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchContainer}>
            <InputField
              placeholder="Search user name..."
              value={userSearch}
              onChangeText={setUserSearch}
              icon={<Ionicons name="search-outline" size={20} color={colors.primary} />}
              editable={true}
            />
            {userSearch.length > 0 && (
              <TouchableOpacity
                style={{ position: 'absolute', right: 30, top: 18, zIndex: 2 }}
                onPress={() => setUserSearch('')}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.rolesContainer}>
            {Object.entries(getUsersByRole()).map(([roleType, roleUsers], index) => 
              renderRoleSection(roleType, roleUsers, index)
            )}
          </View>
          
          <Animated.View style={[styles.statsSection, { opacity: fadeAnim }]}>
            <Animated.View
              style={{
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  })
                }]
              }}
            >
              <LinearGradient
                colors={[`${colors.primary}1A`, `${colors.primary}0A`]}
                style={styles.totalOverviewCard}
              >
                <View style={styles.totalOverviewContent}>
                  <View style={styles.totalOverviewLeft}>
                    <View style={[styles.totalIconContainer, { backgroundColor: colors.primary }]}>
                      <Ionicons name="people" size={32} color="white" />
                    </View>
                    <View style={styles.totalTextContainer}>
                      <Text style={styles.totalCount}>{users.length}</Text>
                      <Text style={styles.totalLabel}>Total Users</Text>
                      <Text style={styles.totalSubtext}>Registered in the system</Text>
                    </View>
                  </View>
                  
                  <View style={styles.totalOverviewRight}>
                    <View style={styles.quickStatsContainer}>
                      {Object.entries(getUsersByRole()).map(([roleType, roleUsers]) => {
                        if (roleUsers.length === 0) return null;
                        const roleInfo = USER_TYPE_INFO[roleType];
                        return (
                          <View key={roleType} style={styles.quickStatItem}>
                            <View style={[styles.quickStatDot, { backgroundColor: roleInfo.color }]} />
                            <Text style={styles.quickStatText}>{roleUsers.length} {roleInfo.title}s</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </Animated.View>
      
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="people" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>Users</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Party')}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Party</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  contentContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 80 : 95,
  },
  loadingText: {
    marginTop: spacing.medium,
    fontSize: 16,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 80 : 95,
    paddingBottom: 120,
  },
  statsSection: {
    paddingHorizontal: spacing.large,
    marginTop: spacing.large,
    paddingTop: spacing.medium,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  totalOverviewCard: {
    borderRadius: borderRadius.large,
    padding: spacing.large,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  totalOverviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalOverviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  totalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.large,
  },
  totalTextContainer: {
    flex: 1,
  },
  totalCount: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  totalSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  totalOverviewRight: {
    alignItems: 'flex-end',
  },
  quickStatsContainer: {
    alignItems: 'flex-end',
  },
  quickStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  quickStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  quickStatText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  rolesContainer: {
    paddingHorizontal: spacing.large,
    marginTop: spacing.large,
  },
  roleSection: {
    marginBottom: spacing.xlarge,
  },
  roleSectionCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    overflow: 'hidden', 
  },
  roleSectionShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.08)',
      },
    }),
  },
  roleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.large,
    paddingBottom: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  roleTitleContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  roleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  roleCountBadge: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    minWidth: 32,
    alignItems: 'center',
  },
  roleCountText: {
    fontSize: 16,
    fontWeight: '700',
  },
  roleUsersList: { 
    gap: spacing.medium,
  },
  userCard: {
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  userCardGradient: {
    position: 'relative',
  },
  currentUserCard: { 
    transform: [{ scale: 1.02 }],
    borderColor: colors.warning,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
  },
  userLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    position: 'relative',
    marginRight: spacing.large,
  },
  userInitial: {
    fontSize: 22,
    fontWeight: '700',
  },
  userGlow: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 32,
    zIndex: -1,
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.medium,
    paddingVertical: 6,
    borderRadius: borderRadius.medium,
  },
  userTypeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '700',
  },
  userDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  userRightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  userActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCardAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
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
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  },
  searchContainer: {
    marginBottom: spacing.small, 
    marginTop: spacing.large,
    paddingHorizontal: spacing.large,
  },
});

export default UsersScreen;
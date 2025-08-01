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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { getAllUsers } from '../../services/userService';
import Message from '../../components/Message';
import TopField from '../../components/TopField';

const USER_TYPE_INFO = {
  KNOWLEDGER: {
    icon: 'shield-checkmark',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
    borderColor: '#A855F7',
    title: 'Knowledger',
    subtitle: 'Full Access',
    priority: 1,
  },
  HOUSER: {
    icon: 'home',
    color: '#059669',
    bgColor: '#ECFDF5',
    borderColor: '#10B981',
    title: 'Houser',
    subtitle: 'Resident Access',
    priority: 2,
  },
  GUEST: {
    icon: 'person-outline',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    borderColor: '#9CA3AF',
    title: 'Guest',
    subtitle: 'Limited Access',
    priority: 3,
  }
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const UsersScreen = ({ navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
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
  }, []);

  const fetchUsers = async () => {
    try {
      setError(null);
      const usersData = await getAllUsers();
      
      // Sort users by priority (Knowledger -> Houser -> Guest)
      const sortedUsers = usersData.sort((a, b) => {
        const priorityA = USER_TYPE_INFO[a.type]?.priority || 999;
        const priorityB = USER_TYPE_INFO[b.type]?.priority || 999;
        
        if (priorityA !== priorityB) return priorityA - priorityB;
        return a.username.localeCompare(b.username);
      });
      
      setUsers(sortedUsers);
    } catch (error) {
      // Check if it's a 404 error (user not authenticated)
      if (error.response && error.response.status === 404) {
        console.log('User not authenticated, redirecting to login...');
        // Force logout to clear any invalid tokens
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

  const renderUserCard = (user, index) => {
    const userInfo = getUserTypeInfo(user.type);
    const isCurrentUser = user.username === currentUser?.username;
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
            }]
          }
        ]}
        activeOpacity={0.8}
      >
        {isCurrentUser && (
          <View style={styles.currentUserBadge}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.currentUserText}>You</Text>
          </View>
        )}
        <View style={styles.userCardContent}>
          <View style={styles.userAvatar}>
            <View style={[styles.userAvatarInner, { backgroundColor: userInfo.bgColor }]}> 
              <Text style={[styles.userInitial, { color: userInfo.color }]}> 
                {user.username.charAt(0).toUpperCase()} 
              </Text> 
            </View> 
            <View style={[styles.userStatusDot, { backgroundColor: userInfo.color }]} /> 
          </View> 
          <View style={styles.userInfo}> 
            <Text style={styles.userName}>{user.username}</Text> 
            <View style={[styles.userTypeBadge, { backgroundColor: userInfo.bgColor }]}> 
              <Ionicons name={userInfo.icon} size={12} color={userInfo.color} /> 
              <Text style={[styles.userTypeText, { color: userInfo.color }]}> 
                {userInfo.title} 
              </Text> 
            </View> 
            <Text style={styles.userSubtitle}>{userInfo.subtitle}</Text> 
          </View> 
          <TouchableOpacity style={[styles.userActionButton, { borderColor: userInfo.color }]}> 
            <Ionicons name="chevron-forward" size={18} color={userInfo.color} /> 
          </TouchableOpacity> 
        </View> 
      </AnimatedTouchable>
    );
  };



  const getStatsData = () => {
    const stats = users.reduce((acc, user) => {
      acc[user.type] = (acc[user.type] || 0) + 1;
      return acc;
    }, {});

    return [
      { type: 'KNOWLEDGER', count: stats.KNOWLEDGER || 0, ...USER_TYPE_INFO.KNOWLEDGER },
      { type: 'HOUSER', count: stats.HOUSER || 0, ...USER_TYPE_INFO.HOUSER },
      { type: 'GUEST', count: stats.GUEST || 0, ...USER_TYPE_INFO.GUEST }
    ];
  };

  const renderStatsCard = (stat, index) => (
    <Animated.View 
      key={stat.type}
      style={[
        styles.statsCard,
        { backgroundColor: stat.bgColor, borderColor: stat.borderColor },
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30 + (index * 10), 0]
            })
          }]
        }
      ]}
    >
      <View style={[styles.statsIconContainer, { backgroundColor: stat.color }]}>
        <Ionicons name={stat.icon} size={24} color="white" />
      </View>
      <View style={styles.statsContent}>
        <Text style={[styles.statsCount, { color: stat.color }]}>{stat.count}</Text>
        <Text style={[styles.statsLabel, { color: stat.color }]}>{stat.title}</Text>
      </View>
    </Animated.View>
  );

  const getUsersByRole = () => {
    const usersByRole = {
      KNOWLEDGER: [],
      HOUSER: [],
      GUEST: []
    };
    
    users.forEach(user => {
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
        <View style={styles.roleSectionHeader}>
          <View style={[styles.roleIconContainer, { backgroundColor: roleInfo.color }]}>
            <Ionicons name={roleInfo.icon} size={18} color="white" />
          </View>
          <View style={styles.roleTitleContainer}>
            <Text style={[styles.roleTitle, { color: roleInfo.color }]}>{roleInfo.title}s</Text>
            <Text style={styles.roleSubtitle}>{roleInfo.subtitle} • {roleUsers.length} user{roleUsers.length !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        
        <View style={styles.roleUsersList}>
          {roleUsers.map((user, index) => renderUserCard(user, index))}
        </View>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Users</Text>
          <View style={styles.addButtonPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      <Message 
        message={error}
        onDismiss={dismissError}
        type="error"
      />
      
      {/* Top Field Component */}
      <TopField 
        greeting={getTimeBasedGreeting()}
        userName={currentUser?.username}
        userAvatar={require('../../../assets/avatar.png')}
        userType={currentUser?.type}
        isOnline={true}
        onProfilePress={() => {}}
        showDarkModeToggle={true}
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
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Users by Role */}
          <View style={styles.rolesContainer}>
            {Object.entries(getUsersByRole()).map(([roleType, roleUsers], index) => 
              renderRoleSection(roleType, roleUsers, index)
            )}
          </View>
          
          {/* Overview Section - Moved to bottom */}
          <Animated.View style={[styles.statsSection, styles.bottomStatsSection, { opacity: fadeAnim }]}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsContainer}>
              {getStatsData().map(renderStatsCard)}
              {/* Total Users Card */}
              <Animated.View 
                style={[
                  styles.statsCard,
                  styles.totalStatsCard,
                  {
                    opacity: fadeAnim,
                    transform: [{
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }]
                  }
                ]}
              >
                <View style={[styles.statsIconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="people" size={24} color="white" />
                </View>
                <View style={styles.statsContent}>
                  <Text style={[styles.statsCount, { color: colors.primary }]}>{users.length}</Text>
                  <Text style={[styles.statsLabel, { color: colors.primary }]}>Total Users</Text>
                </View>
              </Animated.View>
            </View>
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
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Logout</Text>
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
    paddingBottom: 100,
  },
  statsSection: {
    padding: spacing.large,
  },
  bottomStatsSection: {
    marginTop: spacing.large,
    paddingTop: spacing.large,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  statsContainer: {
    flexDirection: 'column',
    gap: spacing.medium,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.large,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    minHeight: 70,
    // Different shadow styles for iOS and Android
    ...(Platform.OS === 'ios' ? {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 2,
      shadowColor: 'transparent', // Remove shadow color on Android
    }),
  },
  totalStatsCard: {
    backgroundColor: `${colors.primary}08`,
    borderColor: `${colors.primary}30`,
    // Override elevation for total stats card on Android
    ...(Platform.OS === 'android' && {
      elevation: 1,
      shadowColor: 'transparent',
    }),
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.large,
  },
  statsContent: {
    flex: 1,
  },
  statsCount: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statsLabel: {
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
  rolesContainer: {
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.medium,
    marginTop: spacing.large,
  },
  roleSection: {
    marginBottom: spacing.large,
  },
  roleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    paddingBottom: spacing.small,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  roleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  roleUsersList: {
    gap: spacing.medium,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    position: 'relative',
    // Different shadow styles for iOS and Android
    ...(Platform.OS === 'ios' ? {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    } : {
      elevation: 2,
      shadowColor: 'transparent',
    }),
  },
  currentUserCard: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  currentUserBadge: {
    position: 'absolute',
    top: spacing.small,
    right: spacing.small,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  currentUserText: {
    marginLeft: 4,
    fontSize: 10,
    fontWeight: '600',
    color: colors.warning,
  },
  userCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.large,
  },
  userAvatar: {
    position: 'relative',
    marginRight: spacing.medium,
  },
  userAvatarInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  userStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.card,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  userTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  userTypeText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  userSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  userActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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
    // Different shadow styles for iOS and Android
    ...(Platform.OS === 'ios' ? {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 8,
      shadowColor: 'transparent',
    }),
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  },
});

export default UsersScreen;

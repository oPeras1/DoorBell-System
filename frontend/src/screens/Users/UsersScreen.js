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
import { getTimeBasedGreeting } from '../../constants/functions';
import BottomNavBar from '../../components/BottomNavBar';
import { USER_TYPE_INFO } from '../../constants/users';
import { useColors } from '../../hooks/useColors';

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
  const colors = useColors();

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
      return require('../../../assets/Avatar/avatarknowledger.jpg');
    }
    if (userType === 'HOUSER') {
      return require('../../../assets/Avatar/avatarhouser.png');
    }
    return require('../../../assets/Avatar/avatarguest.jpeg');
  };

  const renderUserCard = (user, index, arr) => {
    const userInfo = getUserTypeInfo(user.type);
    const isCurrentUser = user.username === currentUser?.username;
    const isKnowledger = currentUser?.type === 'KNOWLEDGER';

    return (
      <AnimatedTouchable
        key={user.username}
        style={[
          styles.userCard(colors),
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
          navigation.navigate('UserDetails', { userId: user.id });
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
                <Text style={styles.userName(colors)}>{user.username}</Text>
                <View style={[styles.userTypeBadge, { backgroundColor: userInfo.bgColor }]}>
                  <Ionicons name={userInfo.icon} size={12} color={userInfo.color} />
                  <Text style={[styles.userTypeText, { color: userInfo.color }]}>
                    {userInfo.title}
                  </Text>
                </View>
                {isCurrentUser && <Text style={styles.userDescription(colors)}>(You)</Text>}
              </View>
            </View>
            <View style={styles.userRightSection}>
              {isKnowledger && !isCurrentUser && (
                <TouchableOpacity 
                  style={[styles.userActionButton, { borderColor: `${userInfo.color}80`, backgroundColor: `${userInfo.color}15` }]}
                  onPress={() => {
                    navigation.navigate('UserDetails', { userId: user.id });
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
          styles.roleSectionCard(colors),
          { borderLeftColor: roleInfo.color, borderLeftWidth: 4 },
          styles.roleSectionShadow
        ]}>
          <View style={styles.roleSectionHeader}>
            <View style={styles.roleHeaderLeft}>
              <View style={[styles.roleIconContainer, { backgroundColor: roleInfo.color }]}>
                <Ionicons name={roleInfo.icon} size={20} color="white" />
              </View>
              <View style={styles.roleTitleContainer}>
                <Text style={[styles.roleTitle, { color: roleInfo.color }]}>{roleInfo.title}s</Text>
                <Text style={styles.roleSubtitle(colors)}>{roleInfo.subtitle}</Text>
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
      <View style={styles.container(colors)}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <TopField 
          greeting={getTimeBasedGreeting()}
          userName={currentUser?.username}
          userType={currentUser?.type}
          isOnline={true}
          onProfilePress={() => {}}
          showDarkModeToggle={true}
          onLogout={logout}
          navigation={navigation}
        />
        <View style={styles.loadingContainer(colors)}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText(colors)}>Loading users...</Text>
        </View>
        
        <BottomNavBar navigation={navigation} active="Users" />
      </View>
    );
  }

  return (
    <View style={styles.container(colors)}>
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
        navigation={navigation}
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
                style={styles.totalOverviewCard(colors)}
              >
                <View style={styles.totalOverviewContent}>
                  <View style={styles.totalOverviewLeft}>
                    <View style={styles.totalIconContainer(colors)}>
                      <Ionicons name="people" size={32} color="white" />
                    </View>
                    <View style={styles.totalTextContainer}>
                      <Text style={styles.totalCount(colors)}>{users.length}</Text>
                      <Text style={styles.totalLabel(colors)}>Total Users</Text>
                      <Text style={styles.totalSubtext(colors)}>Registered in the system</Text>
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
                            <Text style={styles.quickStatText(colors)}>{roleUsers.length} {roleInfo.title}s</Text>
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
      
      <BottomNavBar navigation={navigation} active="Users" />
    </View>
  );
};


const styles = {
  container: (colors) => ({
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  }),
  contentContainer: {
    flex: 1,
  },
  loadingContainer: (colors) => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 80 : 95,
  }),
  loadingText: (colors) => ({
    marginTop: spacing.medium,
    fontSize: 16,
    color: colors.textSecondary,
  }),
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
    marginBottom: spacing.medium,
  },
  totalOverviewCard: (colors) => ({
    borderRadius: borderRadius.large,
    padding: spacing.large,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  }),
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
  totalIconContainer: (colors) => ({
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.large,
    backgroundColor: colors.primary,
  }),
  totalTextContainer: {
    flex: 1,
  },
  totalCount: (colors) => ({
    fontSize: 32,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 2,
  }),
  totalLabel: (colors) => ({
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  }),
  totalSubtext: (colors) => ({
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  }),
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
  quickStatText: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  }),
  rolesContainer: {
    paddingHorizontal: spacing.large,
    marginTop: spacing.large,
  },
  roleSection: {
    marginBottom: spacing.xlarge,
  },
  roleSectionCard: (colors) => ({
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    overflow: 'hidden', 
  }),
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
  roleSubtitle: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  }),
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
  userCard: (colors) => ({
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  }),
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
  userName: (colors) => ({
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  }),
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
  userDescription: (colors) => ({
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
  }),
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
};

export default UsersScreen;
import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TopField from '../../components/TopField';
import { getTimeBasedGreeting } from '../../constants/functions';
import BottomNavBar from '../../components/BottomNavBar';
import { useColors } from '../../hooks/useColors';
import { 
  getMaintenanceStatus, 
  activateMaintenance, 
  deactivateMaintenance,
  blockRegistration,
  unblockRegistration,
  getRegistrationStatus

} from '../../services/knowledgerService';
import { 
  deleteUser,
  updateMultipleDoorOpen 
} from '../../services/userService';
import PopUp from '../../components/PopUp';
import Message from '../../components/Message';
import Switch from '../../components/Switch';
import Constants from 'expo-constants'; 
import * as Location from 'expo-location';

const SettingsScreen = ({ navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(false);
  const [showMaintenancePopup, setShowMaintenancePopup] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);
  const [isRegistrationBlocked, setIsRegistrationBlocked] = useState(false);
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(false);
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);
  const [pendingRegistrationState, setPendingRegistrationState] = useState(false);
  const [showDeleteAccountPopup, setShowDeleteAccountPopup] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [isDualDoorActive, setIsDualDoorActive] = useState(false);
  const [isLoadingDualDoor, setIsLoadingDualDoor] = useState(false);
  const [showDualDoorPopup, setShowDualDoorPopup] = useState(false);
  const [pendingDualDoorState, setPendingDualDoorState] = useState(false);
  const colors = useColors();

  const isKnowledger = currentUser?.type === 'KNOWLEDGER';

  const currentVersion = Constants.expoConfig?.version || '1.0.0';

  useEffect(() => {
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

  useEffect(() => {
    if (isKnowledger) {
      fetchMaintenanceStatus();
      fetchRegistrationStatus();
    }
    // Initialize dual door state from user data
    if (currentUser?.multipleDoorOpen !== undefined) {
      setIsDualDoorActive(currentUser.multipleDoorOpen);
    }
  }, [isKnowledger, currentUser]);

  const fetchMaintenanceStatus = async () => {
    try {
      const status = await getMaintenanceStatus();
      setIsMaintenanceActive(status);
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
    }
  };

  const fetchRegistrationStatus = async () => {
    try {
      const status = await getRegistrationStatus();
      setIsRegistrationBlocked(status);
    } catch (error) {
      console.error('Error fetching registration status:', error);
    }
  };

  const handleMaintenanceToggle = (value) => {
    setPendingMaintenanceState(value);
    setShowMaintenancePopup(true);
  };

  const confirmMaintenanceChange = async () => {
    try {
      setIsLoadingMaintenance(true);
      setShowMaintenancePopup(false);
      
      if (pendingMaintenanceState) {
        await activateMaintenance();
        setMessage('Maintenance mode activated successfully');
      } else {
        await deactivateMaintenance();
        setMessage('Maintenance mode deactivated successfully');
      }
      
      setIsMaintenanceActive(pendingMaintenanceState);
      setMessageType('success');
    } catch (error) {
      console.error('Error changing maintenance mode:', error);
      setMessage('Failed to change maintenance mode');
      setMessageType('error');
    } finally {
      setIsLoadingMaintenance(false);
    }
  };

  const cancelMaintenanceChange = () => {
    setShowMaintenancePopup(false);
    setPendingMaintenanceState(isMaintenanceActive);
  };

  const handleRegistrationToggle = (value) => {
    setPendingRegistrationState(value);
    setShowRegistrationPopup(true);
  };

  const confirmRegistrationChange = async () => {
    try {
      setIsLoadingRegistration(true);
      setShowRegistrationPopup(false);

      if (pendingRegistrationState) {
        await blockRegistration();
        setMessage('User registration blocked successfully');
      } else {
        await unblockRegistration();
        setMessage('User registration unblocked successfully');
      }

      setIsRegistrationBlocked(pendingRegistrationState);
      setMessageType('success');
    } catch (error) {
      console.error('Error changing registration block:', error);
      setMessage('Failed to change registration block');
      setMessageType('error');
    } finally {
      setIsLoadingRegistration(false);
    }
  };

  const cancelRegistrationChange = () => {
    setShowRegistrationPopup(false);
    setPendingRegistrationState(isRegistrationBlocked);
  };

  const handleDeleteAccount = () => {
    setShowDeleteAccountPopup(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      setShowDeleteAccountPopup(false);
      
      await deleteUser(currentUser.id);
      
      setMessage('Account deleted successfully. Logging out...');
      setMessageType('success');
      
      // Logout and navigate to login after a short delay
      setTimeout(async () => {
        await logout();
        navigation.reset({
          index: 0,
          routes: [{ name: 'AuthStack' }],
        });
      }, 2000);
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage('Failed to delete account. Please try again.');
      setMessageType('error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const cancelDeleteAccount = () => {
    setShowDeleteAccountPopup(false);
  };

  const handlePersonalSettings = () => {
    if (currentUser?.id) {
      navigation.navigate('UserDetails', { userId: currentUser.id });
    }
  };

  const handleDualDoorToggle = (value) => {
    setPendingDualDoorState(value);
    setShowDualDoorPopup(true);
  };

  const confirmDualDoorChange = async () => {
    try {
      setIsLoadingDualDoor(true);
      setShowDualDoorPopup(false);
      
      if (pendingDualDoorState) {
        // Request location permission when activating
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setMessage('Location permission is required to activate dual door opening');
          setMessageType('error');
          setIsLoadingDualDoor(false);
          return;
        }
      }
      
      await updateMultipleDoorOpen(pendingDualDoorState);
      
      setIsDualDoorActive(pendingDualDoorState);
      setMessage(pendingDualDoorState ? 'Dual door opening activated successfully' : 'Dual door opening deactivated successfully');
      setMessageType('success');
    } catch (error) {
      console.error('Error changing dual door mode:', error);
      setMessage('Failed to change dual door mode');
      setMessageType('error');
    } finally {
      setIsLoadingDualDoor(false);
    }
  };

  const cancelDualDoorChange = () => {
    setShowDualDoorPopup(false);
    setPendingDualDoorState(isDualDoorActive);
  };

  return (
    <View style={styles.container(colors)}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* Message fix: absolute container at top, like PartyScreen */}
      <View style={styles.messageContainer}>
        <Message
          message={message}
          type={messageType}
          onDismiss={() => setMessage('')}
        />
      </View>

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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.settingsSection}>
            {/* Personal Account Setting */}
            <TouchableOpacity 
              style={styles.settingsItem(colors)}
              onPress={handlePersonalSettings}
              activeOpacity={0.7}
            >
              <View style={styles.settingsItemContent}>
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="person-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.settingsTextContainer}>
                    <Text style={styles.settingsItemTitle(colors)}>Personal Account</Text>
                    <Text style={styles.settingsItemSubtitle(colors)}>Edit your profile and account details for a better experience.</Text>
                  </View>
                </View>
                <View style={styles.settingsItemRight}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>

            {isKnowledger && (
              <TouchableOpacity
                style={styles.settingsItem(colors)}
                onPress={() => navigation.navigate('ForgotPassword')}
                activeOpacity={0.7}
              >
                <View style={styles.settingsItemContent}>
                  <View style={styles.settingsItemLeft}>
                    <View style={[
                      styles.settingsIconContainer,
                      { backgroundColor: `${colors.warning}15` }
                    ]}>
                      <Ionicons name="key-outline" size={24} color={colors.warning} />
                    </View>
                    <View style={styles.settingsTextContainer}>
                      <Text style={styles.settingsItemTitle(colors)}>Password Reset Requests</Text>
                      <Text style={styles.settingsItemSubtitle(colors)}>
                        Review and approve password reset requests from users
                      </Text>
                    </View>
                  </View>
                  <View style={styles.settingsItemRight}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {isKnowledger && (
              <TouchableOpacity
                style={styles.settingsItem(colors)}
                onPress={() => navigation.navigate('Logs')}
                activeOpacity={0.7}
              >
                <View style={styles.settingsItemContent}>
                  <View style={styles.settingsItemLeft}>
                    <View style={[
                      styles.settingsIconContainer,
                      { backgroundColor: `${colors.info}15` }
                    ]}>
                      <Ionicons name="document-text-outline" size={24} color={colors.info} />
                    </View>
                    <View style={styles.settingsTextContainer}>
                      <Text style={styles.settingsItemTitle(colors)}>System Logs</Text>
                      <Text style={styles.settingsItemSubtitle(colors)}>
                        View and filter all system events and user activities
                      </Text>
                    </View>
                  </View>
                  <View style={styles.settingsItemRight}>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Dual Door Opening Setting - Visible to all users */}
            <View style={styles.settingsItem(colors)}>
              <View style={styles.settingsItemContent}>
                <View style={styles.settingsItemLeft}>
                  <View style={[
                    styles.settingsIconContainer, 
                    { backgroundColor: isDualDoorActive ? `${colors.success}15` : `${colors.primary}15` }
                  ]}>
                    <Ionicons 
                      name={isDualDoorActive ? "home" : "home-outline"} 
                      size={24} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.settingsTextContainer}>
                    <Text style={styles.settingsItemTitle(colors)}>Dual Door Opening</Text>
                    <Text style={styles.settingsItemSubtitle(colors)}>
                      {isDualDoorActive 
                        ? 'Dual door opening is now active. Your location will be used for security.' 
                        : 'Opens both doors. Needs to obtain location for security reasons!'}
                    </Text>
                  </View>
                </View>
                <View style={styles.settingsItemRight}>
                  <Switch
                    value={isDualDoorActive}
                    onValueChange={handleDualDoorToggle}
                    disabled={isLoadingDualDoor}
                    size="medium"
                    activeColor={colors.primary}
                    inactiveColor={colors.border}
                    thumbColor={isDualDoorActive ? '#FFFFFF' : colors.textSecondary}
                  />
                </View>
              </View>
            </View>

            {/* Maintenance Mode Setting - Only for Knowledgers */}
            {isKnowledger && (
              <>
                <View style={styles.settingsItem(colors)}>
                  <View style={styles.settingsItemContent}>
                    <View style={styles.settingsItemLeft}>
                      <View style={[
                        styles.settingsIconContainer, 
                        { backgroundColor: isMaintenanceActive ? `${colors.info}15` : `${colors.primary}15` }
                      ]}>
                        <Ionicons 
                          name={isMaintenanceActive ? "information-circle" : "settings-outline"} 
                          size={24} 
                          color={colors.primary} 
                        />
                      </View>
                      <View style={styles.settingsTextContainer}>
                        <Text style={styles.settingsItemTitle(colors)}>Maintenance Mode</Text>
                        <Text style={styles.settingsItemSubtitle(colors)}>
                          {isMaintenanceActive 
                            ? 'System is currently in maintenance mode' 
                            : 'Toggle system maintenance mode and restrict door access'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.settingsItemRight}>
                      <Switch
                        value={isMaintenanceActive}
                        onValueChange={handleMaintenanceToggle}
                        disabled={isLoadingMaintenance}
                        size="medium"
                        activeColor={colors.primary}
                        inactiveColor={colors.border}
                        thumbColor={isMaintenanceActive ? '#FFFFFF' : colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>

                {/* Registration Block Setting - Only for Knowledgers */}
                <View style={styles.settingsItem(colors)}>
                  <View style={styles.settingsItemContent}>
                    <View style={styles.settingsItemLeft}>
                      <View style={[
                        styles.settingsIconContainer, 
                        { backgroundColor: isRegistrationBlocked ? `${colors.error}15` : `${colors.primary}15` }
                      ]}>
                        <Ionicons 
                          name={isRegistrationBlocked ? "lock-closed" : "lock-open"} 
                          size={24} 
                          color={colors.primary} 
                        />
                      </View>
                      <View style={styles.settingsTextContainer}>
                        <Text style={styles.settingsItemTitle(colors)}>Block User Registration</Text>
                        <Text style={styles.settingsItemSubtitle(colors)}>
                          {isRegistrationBlocked
                            ? 'New user registrations are currently blocked'
                            : 'Toggle to block or allow new user registrations'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.settingsItemRight}>
                      <Switch
                        value={isRegistrationBlocked}
                        onValueChange={handleRegistrationToggle}
                        disabled={isLoadingRegistration}
                        size="medium"
                        activeColor={colors.primary}
                        inactiveColor={colors.border}
                        thumbColor={isRegistrationBlocked ? '#FFFFFF' : colors.textSecondary}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* Delete Account Setting - Danger Zone */}
            <View style={styles.dangerZoneItem(colors)}>
              <View style={styles.dangerZoneHeader}>
                <Ionicons name="warning" size={24} color={colors.danger} />
                <Text style={styles.dangerZoneTitle(colors)}>Danger Zone</Text>
              </View>
              <Text style={styles.dangerZoneDescription(colors)}>
                Permanently delete your account. This action cannot be undone and will remove all your data including parties, notifications, and logs.
              </Text>
              <TouchableOpacity 
                style={styles.deleteAccountButton(colors)}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={styles.deleteAccountButtonText}>
                  {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* About Section */}
            <View style={styles.aboutItem(colors)}>
              <View style={styles.aboutHeader}>
                <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
                <Text style={styles.aboutTitle(colors)}>About</Text>
              </View>
              <View style={styles.aboutContent}>
                <View style={styles.aboutRow}>
                  <Image
                    source={require('../../../assets/doorbell-logo.png')}
                    style={styles.aboutLogo}
                    resizeMode="contain"
                  />
                  <View style={styles.aboutTextContainer}>
                    <Text style={styles.appName(colors)}>DoorBell Access</Text>
                    <View style={styles.versionContainer}>
                      <Text style={styles.versionText(colors)}>Version {currentVersion}</Text>
                      <View style={styles.betaChip}>
                        <Text style={styles.betaText}>BETA</Text>
                      </View>
                    </View>
                    <Text style={styles.lastUpdatedText(colors)}>Last updated: 30/08/2025</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Maintenance Confirmation Popup */}
      <PopUp
        visible={showMaintenancePopup}
        type={pendingMaintenanceState ? "warning" : "info"}
        title={pendingMaintenanceState ? "Activate Maintenance Mode" : "Deactivate Maintenance Mode"}
        message={pendingMaintenanceState 
          ? "This will prevent users from opening the door. Only knowledgers will be able to access the system. Are you sure?"
          : "This will restore normal door access for all users. Are you sure?"
        }
        confirmText={pendingMaintenanceState ? "Activate" : "Deactivate"}
        cancelText="Cancel"
        onConfirm={confirmMaintenanceChange}
        onCancel={cancelMaintenanceChange}
        showCancel={true}
      />

      {/* Registration Block Confirmation Popup */}
      <PopUp
        visible={showRegistrationPopup}
        type={pendingRegistrationState ? "warning" : "info"}
        title={pendingRegistrationState ? "Block User Registration" : "Unblock User Registration"}
        message={pendingRegistrationState
          ? "This will prevent new users from registering. Are you sure?"
          : "This will allow new users to register again. Are you sure?"
        }
        confirmText={pendingRegistrationState ? "Block" : "Unblock"}
        cancelText="Cancel"
        onConfirm={confirmRegistrationChange}
        onCancel={cancelRegistrationChange}
        showCancel={true}
      />

      {/* Dual Door Confirmation Popup */}
      <PopUp
        visible={showDualDoorPopup}
        type={pendingDualDoorState ? "warning" : "info"}
        title={pendingDualDoorState ? "Activate Dual Door Opening" : "Deactivate Dual Door Opening"}
        message={pendingDualDoorState
          ? "This will open both street and home doors. Location access is required for security. Are you sure?"
          : "This will disable dual door opening. Are you sure?"
        }
        confirmText={pendingDualDoorState ? "Activate" : "Deactivate"}
        cancelText="Cancel"
        onConfirm={confirmDualDoorChange}
        onCancel={cancelDualDoorChange}
        showCancel={true}
      />

      {/* Delete Account Confirmation Popup */}
      <PopUp
        visible={showDeleteAccountPopup}
        type="danger"
        title="Delete Account"
        message={`Are you sure you want to permanently delete your account (${currentUser?.username})? This action cannot be undone and will remove all associated data including parties, notifications, and logs.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteAccount}
        onCancel={cancelDeleteAccount}
        showCancel={true}
      />

      <BottomNavBar navigation={navigation} active="Settings" />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 80 : 95,
    paddingHorizontal: spacing.large,
    paddingBottom: 100,
  },
  settingsSection: {
    marginTop: spacing.medium,
  },
  settingsItem: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  }),
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.large,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.large,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsItemTitle: (colors) => ({
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  }),
  settingsItemSubtitle: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
  }),
  settingsItemRight: {
    paddingLeft: spacing.medium,
  },
  messageContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 25 : 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    pointerEvents: 'box-none',
  },
  dangerZoneItem: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.medium,
    borderWidth: 1,
    borderColor: colors.danger + '30',
    marginTop: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 20px ${colors.danger}20`,
      },
    }),
  }),
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  dangerZoneTitle: (colors) => ({
    fontSize: 18,
    fontWeight: '600',
    color: colors.danger,
  }),
  dangerZoneDescription: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.medium,
  }),
  deleteAccountButton: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    gap: spacing.small,
    alignSelf: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: `0 2px 8px ${colors.danger}40`,
      },
    }),
  }),
  deleteAccountButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  aboutItem: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.medium,
    marginTop: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  }),
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  aboutTitle: (colors) => ({
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  }),
  aboutContent: {
    gap: spacing.small,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  aboutLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
  },
  aboutTextContainer: {
    flex: 1,
  },
  appName: (colors) => ({
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'left',
  }),
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing.small,
  },
  versionText: (colors) => ({
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  }),
  betaChip: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  lastUpdatedText: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'left',
    fontStyle: 'italic',
  }),
};

export default SettingsScreen;
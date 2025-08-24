import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar
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
  deactivateMaintenance 
} from '../../services/doorService';
import { 
  getRegistrationStatus, 
  blockRegistration, 
  unblockRegistration 
} from '../../services/userService';
import PopUp from '../../components/PopUp';
import Message from '../../components/Message';
import Switch from '../../components/Switch';

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
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const colors = useColors();

  const isKnowledger = currentUser?.type === 'KNOWLEDGER';

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
  }, [isKnowledger]);

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

  const handlePersonalSettings = () => {
    if (currentUser?.id) {
      navigation.navigate('UserDetails', { userId: currentUser.id });
    }
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
                    <Text style={styles.settingsItemSubtitle(colors)}>Edit your profile and account details</Text>
                  </View>
                </View>
                <View style={styles.settingsItemRight}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>

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
                            : 'Toggle system maintenance mode'}
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
};

export default SettingsScreen;
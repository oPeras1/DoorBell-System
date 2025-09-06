import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  RefreshControl,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Modal
} from 'react-native';
import { spacing, borderRadius } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../context/AuthContext';
import Message from '../../components/Message';
import PopUp from '../../components/PopUp';
import { USER_TYPE_INFO, CONNECTION_MODES } from '../../constants/users';
import { getAvatarSource } from '../../constants/functions';
import { getUserById, updateUserType, updateUsername, updateBirthdate, updateUserMuted, deleteUser } from '../../services/userService';
import { useColors } from '../../hooks/useColors';

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

const UsersDetailsScreen = ({ navigation, route }) => {
  const { userId } = route.params;
  const { user: currentUser } = useContext(AuthContext);

  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // User data states
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI states
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Edit states
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingBirthdate, setEditingBirthdate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newBirthdate, setNewBirthdate] = useState('');
  
  // Popup states
  const [showTypeChangePopup, setShowTypeChangePopup] = useState(false);
  const [showDoorAccessPopup, setShowDoorAccessPopup] = useState(false);
  const [showDeleteUserPopup, setShowDeleteUserPopup] = useState(false);
  const [showTypeSelectionModal, setShowTypeSelectionModal] = useState(false);
  const [showDoorAccessModal, setShowDoorAccessModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [doorAccessValue, setDoorAccessValue] = useState(null);

  // Get colors from theme
  const colors = useColors();

  // Permission checks
  const isCurrentUser = currentUser?.id === userId;
  const isKnowledger = currentUser?.type === 'KNOWLEDGER';
  const isTargetKnowledger = user?.type === 'KNOWLEDGER';
  
  // Can edit basic info if current user is Knowledger (and target is not Knowledger) or if viewing own profile
  const canEditBasicInfo = isCurrentUser || (isKnowledger && !isTargetKnowledger);
  
  // Can change user type if current user is Knowledger and target is not a Knowledger
  const canChangeUserType = isKnowledger && !isTargetKnowledger && !isCurrentUser;
  
  // Can change door access if current user is Knowledger and target is not a Knowledger
  const canChangeDoorAccess = isKnowledger && !isTargetKnowledger;

  // Can view access control - only Knowledgers can see this section
  const canViewAccessControl = isKnowledger;

  // Can delete user - only Knowledgers can delete other users (but not other Knowledgers or themselves)
  const canDeleteUser = isKnowledger && !isTargetKnowledger && !isCurrentUser;

  useEffect(() => {
    fetchUserDetails();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: false }),
    ]).start();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const userData = await getUserById(userId);
      setUser(userData);
      setNewUsername(userData.username);
      setNewBirthdate(userData.birthdate || '');
      setDoorAccessValue(userData.muted);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setErrorMessage('Failed to load user details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDetails();
  }, [userId]);

  const handleBack = () => navigation.goBack();

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const showSuccessMessage = (msg) => {
    setMessage(msg);
    setMessageType('success');
    setTimeout(() => setMessage(''), 3000);
  };

  const showErrorMessage = (msg) => {
    setMessage(msg);
    setMessageType('error');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleSaveUsername = async () => {
    if (!newUsername || newUsername.trim() === '') {
      showErrorMessage('Username cannot be empty');
      return;
    }

    try {
      await updateUsername(userId, newUsername);
      setUser(prev => ({...prev, username: newUsername}));
      setEditingUsername(false);
      showSuccessMessage('Username updated successfully');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update username';
      console.error('Error updating username:', error);
      showErrorMessage(msg);
    }
  };

  const handleSaveBirthdate = async () => {
    // Basic date validation
    if (newBirthdate && !/^\d{4}-\d{2}-\d{2}$/.test(newBirthdate)) {
      showErrorMessage('Please use YYYY-MM-DD format');
      return;
    }

    try {
      await updateBirthdate(userId, newBirthdate);
      setUser(prev => ({...prev, birthdate: newBirthdate}));
      setEditingBirthdate(false);
      showSuccessMessage('Birthdate updated successfully');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update birthdate';
      console.error('Error updating birthdate:', error);
      showErrorMessage(msg);
    }
  };

  const handleChangeUserType = async () => {
    if (!selectedUserType) return;
    
    try {
      await updateUserType(userId, selectedUserType);
      setUser(prev => ({...prev, type: selectedUserType}));
      setShowTypeChangePopup(false);
      setShowTypeSelectionModal(false);
      showSuccessMessage('User type updated successfully');
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update user type';
      console.error('Error updating user type:', error);
      showErrorMessage(msg);
    }
  };

  const handleChangeDoorAccess = async () => {
    try {
      await updateUserMuted(userId, doorAccessValue);
      setUser(prev => ({...prev, muted: doorAccessValue}));
      setShowDoorAccessPopup(false);
      setShowDoorAccessModal(false);
      showSuccessMessage(`Door access ${doorAccessValue ? 'restricted' : 'enabled'} successfully`);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update door access';
      console.error('Error updating door access:', error);
      showErrorMessage(msg);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser(userId);
      setShowDeleteUserPopup(false);
      showSuccessMessage('User deleted successfully');
      // Navigate back to users list after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to delete user';
      console.error('Error deleting user:', error);
      showErrorMessage(msg);
      setShowDeleteUserPopup(false);
    }
  };

  const openTypeSelection = () => {
    setSelectedUserType(user.type);
    setShowTypeSelectionModal(true);
  };

  const openDoorAccessSelection = () => {
    setDoorAccessValue(user.muted);
    setShowDoorAccessModal(true);
  };

  const confirmTypeChange = () => {
    setShowTypeSelectionModal(false);
    setShowTypeChangePopup(true);
  };

  const confirmDoorAccessChange = () => {
    setShowDoorAccessModal(false);
    setShowDoorAccessPopup(true);
  };

  const getUserTypeInfo = (type) => USER_TYPE_INFO[type] || USER_TYPE_INFO.GUEST;
  const userTypeInfo = user ? getUserTypeInfo(user.type) : USER_TYPE_INFO.GUEST;

  const getConnectionModeInfo = (status) => {
    if (CONNECTION_MODES[status]) return CONNECTION_MODES[status];
    return {
      title: status,
      subtitle: 'Undefined Status',
      icon: 'help-circle',
      color: '#888',
      bgColor: '#eee',
    };
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer(colors)}>
        <View style={styles.loadingIndicatorWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText(colors)}>Loading user details...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centeredContainer(colors)}>
        <Ionicons name="alert-circle" size={64} color={colors.danger} style={{ marginBottom: spacing.large }} />
        <Text style={styles.errorTitle(colors)}>Failed to load user</Text>
        <Text style={styles.errorSubtitle(colors)}>{errorMessage || 'Could not load details for this user.'}</Text>
        <TouchableOpacity style={styles.errorButton(colors)} onPress={handleBack}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton(colors)} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get connection status info
  const connectionInfo = getConnectionModeInfo(user.status || 'ONLINE');

  // Determine if status should be hidden in hero card
  const shouldHideStatus = !isKnowledger && !isCurrentUser;

  return (
    <>
      <View style={styles.messageContainer}>
        <Message 
          message={message} 
          onDismiss={() => setMessage('')} 
          type={messageType} 
        />
      </View>
      
      <PopUp
        visible={showTypeChangePopup}
        title="Change User Type"
        message={`Are you sure you want to change ${user.username}'s access type to ${USER_TYPE_INFO[selectedUserType]?.title}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleChangeUserType}
        onCancel={() => setShowTypeChangePopup(false)}
        type="warning"
      />
      
      <PopUp
        visible={showDoorAccessPopup}
        title={doorAccessValue ? "Restrict Door Access" : "Enable Door Access"}
        message={`Are you sure you want to ${doorAccessValue ? 'restrict' : 'enable'} door access for ${user.username}?`}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleChangeDoorAccess}
        onCancel={() => setShowDoorAccessPopup(false)}
        type="warning"
      />

      <PopUp
        visible={showDeleteUserPopup}
        title="Delete User"
        message={`Are you sure you want to permanently delete ${user?.username}? This action cannot be undone and will remove all user data including parties, notifications, and logs.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteUser}
        onCancel={() => setShowDeleteUserPopup(false)}
        type="danger"
      />

      {/* User Type Selection Modal */}
      <Modal
        visible={showTypeSelectionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTypeSelectionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer(colors)}>
            <View style={styles.modalHeader(colors)}>
              <Text style={styles.modalTitle(colors)}>Select User Type</Text>
              <TouchableOpacity 
                onPress={() => setShowTypeSelectionModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {Object.entries(USER_TYPE_INFO).map(([type, info]) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeOption(colors),
                    selectedUserType === type && styles.typeOptionSelected(colors)
                  ]}
                  onPress={() => setSelectedUserType(type)}
                >
                  <View style={[styles.typeOptionIcon, { backgroundColor: info.bgColor }]}>
                    <Ionicons name={info.icon} size={24} color={info.color} />
                  </View>
                  <View style={styles.typeOptionContent}>
                    <Text style={[styles.typeOptionTitle(colors), { color: info.color }]}>
                      {info.title}
                    </Text>
                    <Text style={styles.typeOptionSubtitle(colors)}>
                      {info.subtitle}
                    </Text>
                    <Text style={styles.typeOptionDescription(colors)}>
                      {info.description}
                    </Text>
                  </View>
                  {selectedUserType === type && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions(colors)}>
              <TouchableOpacity 
                style={styles.modalCancelButton(colors)}
                onPress={() => setShowTypeSelectionModal(false)}
              >
                <Text style={styles.modalCancelText(colors)}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton(colors),
                  !selectedUserType && styles.modalConfirmButtonDisabled(colors)
                ]}
                onPress={confirmTypeChange}
                disabled={!selectedUserType}
              >
                <Text style={styles.modalConfirmText}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Door Access Selection Modal */}
      <Modal
        visible={showDoorAccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDoorAccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer(colors)}>
            <View style={styles.modalHeader(colors)}>
              <Text style={styles.modalTitle(colors)}>Door Access Control</Text>
              <TouchableOpacity 
                onPress={() => setShowDoorAccessModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <TouchableOpacity
                style={[
                  styles.accessOption(colors),
                  doorAccessValue === false && styles.accessOptionSelected(colors)
                ]}
                onPress={() => setDoorAccessValue(false)}
              >
                <View style={[styles.accessOptionIcon, { backgroundColor: colors.success + '15' }]}>
                  <Ionicons name="lock-open" size={24} color={colors.success} />
                </View>
                <View style={styles.accessOptionContent}>
                  <Text style={[styles.accessOptionTitle(colors), { color: colors.success }]}>
                    Enable Access
                  </Text>
                  <Text style={styles.accessOptionDescription(colors)}>
                    User can access the door and create parties (if applicable)
                  </Text>
                </View>
                {doorAccessValue === false && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.accessOption(colors),
                  doorAccessValue === true && styles.accessOptionSelected(colors)
                ]}
                onPress={() => setDoorAccessValue(true)}
              >
                <View style={[styles.accessOptionIcon, { backgroundColor: colors.danger + '15' }]}>
                  <Ionicons name="lock-closed" size={24} color={colors.danger} />
                </View>
                <View style={styles.accessOptionContent}>
                  <Text style={[styles.accessOptionTitle(colors), { color: colors.danger }]}>
                    Restrict Access
                  </Text>
                  <Text style={styles.accessOptionDescription(colors)}>
                    User cannot access the door or create parties (if applicable)
                  </Text>
                </View>
                {doorAccessValue === true && (
                  <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalActions(colors)}>
              <TouchableOpacity 
                style={styles.modalCancelButton(colors)}
                onPress={() => setShowDoorAccessModal(false)}
              >
                <Text style={styles.modalCancelText(colors)}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton(colors)}
                onPress={confirmDoorAccessChange}
              >
                <Text style={styles.modalConfirmText}>
                  {doorAccessValue ? 'Restrict' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={styles.container(colors)}>
        <StatusBar translucent backgroundColor="transparent" barStyle={colors.statusBarStyle || "dark-content"} />
        
        {/* Header */}
        <Animated.View style={[ styles.header(colors), { opacity: fadeAnim, transform: [{ translateY: slideAnim }] } ]}>
          <View style={styles.headerBackground(colors)} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle(colors)} numberOfLines={1}>User details</Text>
              <Text style={styles.headerSubtitle(colors)}>{isCurrentUser ? 'Your profile' : 'User profile'}</Text>
            </View>
            <View style={styles.headerRight}>
              <GradientBackground
                colors={userTypeInfo.gradient || [userTypeInfo.color, userTypeInfo.color]}
                style={styles.headerStatusBadge}
              >
                <Ionicons name={userTypeInfo.icon} size={14} color="white" />
                <Text style={styles.headerStatusText}>{userTypeInfo.title}</Text>
              </GradientBackground>
            </View>
          </View>
        </Animated.View>
        
        {/* Main Content */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressViewOffset={Platform.OS === 'android' ? 120 : 140}
              />
            }
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: spacing.large }}>
              {/* User Hero Card */}
              <GradientBackground colors={userTypeInfo.gradient} style={styles.heroCard}>
                <View style={styles.heroContent}>
                  <View style={styles.heroHeader}>
                    <View style={styles.heroAvatarContainer}>
                      <Image
                        source={getAvatarSource(user.type)}
                        style={styles.heroAvatar}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.heroTitleBox}>
                      <Text style={styles.heroTitle}>
                        {user.username}
                        {isCurrentUser && ' (You)'}
                      </Text>
                      <View style={styles.heroTypeBadge}>
                        <Ionicons name={userTypeInfo.icon} size={16} color='#fff' />
                        <Text style={styles.heroTypeText}>{userTypeInfo.title}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <Ionicons name={shouldHideStatus ? "eye-off" : connectionInfo.icon} size={18} color="white" />
                      <Text style={styles.heroStatText}>
                        {shouldHideStatus ? "Hidden" : connectionInfo.title}
                      </Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Ionicons name={user.muted ? "notifications-off" : "notifications"} size={18} color="white" />
                      <Text style={styles.heroStatText}>{user.muted ? 'No Access' : 'Access'}</Text>
                    </View>
                    {user.birthdate && (
                      <View style={styles.heroStat}>
                        <Ionicons name="calendar" size={18} color="white" />
                        <Text style={styles.heroStatText}>{formatDate(user.birthdate)}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </GradientBackground>

              {/* Basic Information Card */}
              <View style={styles.infoCard(colors)}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                  <Text style={styles.infoCardTitle(colors)}>Basic Information</Text>
                </View>
                
                {/* Username Field */}
                <View style={styles.infoRow(colors)}>
                  <View style={styles.infoLabelContainer}>
                    <Text style={styles.infoLabel(colors)}>Username</Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    {editingUsername ? (
                      <View style={styles.editFieldContainerImproved(colors)}>
                        <TextInput
                          style={styles.editFieldImproved(colors)}
                          value={newUsername}
                          onChangeText={setNewUsername}
                          placeholder="Enter username"
                          placeholderTextColor={colors.textSecondary}
                          autoFocus
                        />
                        <View style={styles.editActionsImproved(colors)}>
                          <TouchableOpacity style={styles.editActionButtonImproved(colors, 'cancel')} onPress={() => setEditingUsername(false)}>
                            <Ionicons name="close" size={18} color={colors.danger} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.editActionButtonImproved(colors, 'save')} onPress={handleSaveUsername}>
                            <Ionicons name="checkmark" size={18} color={colors.success} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.valueWithAction}>
                        <Text style={styles.infoValue(colors)}>{user.username}</Text>
                        {canEditBasicInfo && (
                          <TouchableOpacity 
                            style={styles.editButton(colors)} 
                            onPress={() => {
                              setNewUsername(user.username);
                              setEditingUsername(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Birthdate Field */}
                <View style={styles.infoRow(colors)}>
                  <View style={styles.infoLabelContainer}>
                    <Text style={styles.infoLabel(colors)}>Birthdate</Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    {editingBirthdate ? (
                      <View style={styles.editFieldContainerImproved(colors)}>
                        <TextInput
                          style={styles.editFieldImproved(colors)}
                          value={newBirthdate}
                          onChangeText={setNewBirthdate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={colors.textSecondary}
                          autoFocus
                        />
                        <View style={styles.editActionsImproved(colors)}>
                          <TouchableOpacity style={styles.editActionButtonImproved(colors, 'cancel')} onPress={() => setEditingBirthdate(false)}>
                            <Ionicons name="close" size={18} color={colors.danger} />
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.editActionButtonImproved(colors, 'save')} onPress={handleSaveBirthdate}>
                            <Ionicons name="checkmark" size={18} color={colors.success} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.valueWithAction}>
                        <Text style={styles.infoValue(colors)}>
                          {user.birthdate ? formatDate(user.birthdate) : 'Not set'}
                        </Text>
                        {canEditBasicInfo && (
                          <TouchableOpacity 
                            style={styles.editButton(colors)} 
                            onPress={() => {
                              setNewBirthdate(user.birthdate || '');
                              setEditingBirthdate(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Created At Field */}
                {user.createdAt && (
                  <View style={styles.infoRow(colors)}>
                    <View style={styles.infoLabelContainer}>
                      <Text style={styles.infoLabel(colors)}>Created At</Text>
                    </View>
                    <View style={styles.infoValueContainer}>
                      <Text style={styles.infoValue(colors)}>
                        {formatDateTime(user.createdAt)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* User Type Field */}
                <View style={styles.infoRow(colors)}>
                  <View style={styles.infoLabelContainer}>
                    <Text style={styles.infoLabel(colors)}>User Type</Text>
                  </View>
                  <View style={styles.infoValueContainer}>
                    <View style={styles.valueWithAction}>
                      <View style={[styles.typeBadge, { backgroundColor: userTypeInfo.bgColor }]}>
                        <Ionicons name={userTypeInfo.icon} size={16} color={userTypeInfo.color} />
                        <Text style={[styles.typeBadgeText, { color: userTypeInfo.color }]}>
                          {userTypeInfo.title}
                        </Text>
                      </View>
                      {canChangeUserType && (
                        <TouchableOpacity 
                          style={styles.editButton(colors)} 
                          onPress={openTypeSelection}
                        >
                          <Ionicons name="create-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Access Control Card - Only visible to Knowledgers */}
              {canViewAccessControl && (
                <View style={styles.infoCard(colors)}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="shield" size={24} color={colors.primary} />
                    <Text style={styles.infoCardTitle(colors)}>Access Control</Text>
                  </View>
                  
                  {/* Door Access Field */}
                  <View style={styles.infoRow(colors)}>
                    <View style={styles.infoLabelContainer}>
                      <Text style={styles.infoLabel(colors)}>Door Access</Text>
                    </View>
                    <View style={styles.infoValueContainer}>
                      <View style={styles.valueWithAction}>
                        <View style={[
                          styles.accessBadge, 
                          { backgroundColor: user.muted ? colors.danger + '15' : colors.success + '15' }
                        ]}>
                          <Ionicons 
                            name={user.muted ? "lock-closed" : "lock-open"} 
                            size={16} 
                            color={user.muted ? colors.danger : colors.success} 
                          />
                          <Text style={[
                            styles.accessBadgeText, 
                            { color: user.muted ? colors.danger : colors.success }
                          ]}>
                            {user.muted ? 'No Access' : 'Access Enabled'}
                          </Text>
                        </View>
                        {canChangeDoorAccess && (
                          <TouchableOpacity 
                            style={styles.editButton(colors)}
                            onPress={openDoorAccessSelection}
                          >
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Connection Status Field */}
                  <View style={styles.infoRow(colors)}>
                    <View style={styles.infoLabelContainer}>
                      <Text style={styles.infoLabel(colors)}>Status</Text>
                    </View>
                    <View style={styles.infoValueContainer}>
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: connectionInfo.bgColor }
                      ]}>
                        <Ionicons 
                          name={connectionInfo.icon} 
                          size={16} 
                          color={connectionInfo.color} 
                        />
                        <Text style={[styles.statusBadgeText, { color: connectionInfo.color }]}>
                          {connectionInfo.title}
                        </Text>
                      </View>
                      <Text style={styles.statusDescription(colors)}>{connectionInfo.subtitle}</Text>
                    </View>
                  </View>
                  
                  {/* OneSignal IDs Field */}
                  <View style={styles.infoRow(colors)}>
                    <View style={styles.infoLabelContainer}>
                      <Text style={styles.infoLabel(colors)}>OneSignal IDs</Text>
                    </View>
                    <View style={styles.infoValueContainer}>
                      <Text style={styles.infoValue(colors)}>
                        {user.onesignalId && user.onesignalId.length > 0 ? user.onesignalId.join(', ') : 'None'}
                      </Text>
                    </View>
                  </View>
                  
                  {isCurrentUser && (
                    <Text style={styles.noticeText(colors)}>
                      Only you can change your connection status from the home screen.
                    </Text>
                  )}
                </View>
              )}

              {/* Danger Zone Card - Only visible to Knowledgers when viewing other users */}
              {canDeleteUser && (
                <View style={styles.dangerCard(colors)}>
                  <View style={styles.dangerCardHeader}>
                    <Ionicons name="warning" size={24} color={colors.danger} />
                    <Text style={styles.dangerCardTitle(colors)}>Danger Zone</Text>
                  </View>
                  
                  <Text style={styles.dangerCardDescription(colors)}>
                    Permanently delete this user account. This action cannot be undone and will remove all associated data including parties, notifications, and logs.
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.deleteUserButton(colors)}
                    onPress={() => setShowDeleteUserPopup(true)}
                  >
                    <Ionicons name="trash" size={20} color="white" />
                    <Text style={styles.deleteUserButtonText}>Delete User</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {/* Permissions Info Card */}
              <View style={styles.permissionsCard(colors)}>
                <View style={styles.permissionsIconContainer(colors)}>
                  <Ionicons name="information-circle" size={24} color={colors.info} />
                </View>
                <Text style={styles.permissionsTitle(colors)}>Access Permissions</Text>
                <Text style={styles.permissionsText(colors)}>
                  {user.type === 'KNOWLEDGER' 
                    ? 'Knowledgers have full access to manage users and system settings, except other Knowledgers.' 
                    : user.type === 'HOUSER'
                      ? 'Housers have regular access to home features but cannot modify other users.'
                      : 'Guests have limited access and cannot modify system settings or other users.'}
                </Text>
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
  container: (colors) => ({
    flex: 1,
    backgroundColor: colors.background,
  }),
  centeredContainer: (colors) => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
    backgroundColor: colors.background,
  }),
  loadingIndicatorWrapper: {
    marginTop: 120,
    marginBottom: spacing.large,
  },
  loadingText: (colors) => ({
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  }),
  errorTitle: (colors) => ({
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  }),
  errorSubtitle: (colors) => ({
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  }),
  errorButton: (colors) => ({
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    marginTop: spacing.large,
  }),
  errorButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  refreshButton: (colors) => ({
    marginTop: spacing.large,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
  }),
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Header Styles
  header: (colors) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 0,
  }),
  headerBackground: (colors) => ({
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
        boxShadow: `0 2px 12px ${colors.cardShadow}, 0 1.5px 0px ${colors.cardShadow}`,
      },
    }),
  }),
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
  headerTitle: (colors) => ({
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  }),
  headerSubtitle: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  }),
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
  
  // Scroll Content
  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: spacing.large,
  },
  
  // Hero Card
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
  heroAvatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  heroTitleBox: { 
    flex: 1
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  heroTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.medium,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 6,
  },
  heroTypeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
  
  // Info Card
  infoCard: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        border: `1px solid ${colors.border}`,
        boxShadow: `0 4px 20px ${colors.cardShadow}`,
      },
    }),
  }),
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  infoCardTitle: (colors) => ({
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  }),
  infoRow: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  }),
  infoLabelContainer: {
    width: 100,
  },
  infoLabel: (colors) => ({
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  }),
  infoValueContainer: {
    flex: 1,
  },
  infoValue: (colors) => ({
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  }),
  valueWithAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editButton: (colors) => ({
    padding: 8,
    borderRadius: 20,
    backgroundColor: `${colors.primary}1A`,
  }),
  editFieldContainer: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.medium,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.border,
  }),
  editFieldContainerImproved: (colors) => ({
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 48,
  }),
  editField: (colors) => ({
    flex: 1,
    padding: 8,
    fontSize: 15,
    color: colors.textPrimary,
  }),
  editFieldImproved: (colors) => ({
    flex: 1,
    padding: spacing.medium,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 48,
    ...Platform.select({
      web: {
        outline: 'none',
        resize: 'none',
      },
    }),
  }),
  editActions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  editActionsImproved: (colors) => ({
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }),
  editActionButton: (colors) => ({
    padding: 8,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
  }),
  editActionButtonImproved: (colors, type) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
    backgroundColor: type === 'save' ? colors.success + '10' : colors.danger + '10',
    borderRightWidth: type === 'cancel' ? 1 : 0,
    borderRightColor: colors.border,
  }),
  
  // Type Badge
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
    alignSelf: 'flex-start',
    gap: 6,
  },
  typeBadgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  changeTypeButton: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
    backgroundColor: `${colors.primary}1A`,
    gap: 4,
  }),
  changeTypeButtonImproved: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    gap: spacing.small,
    alignSelf: 'flex-start',
  }),
  changeTypeText: {
    color: '#4361EE',
    fontWeight: '600',
    fontSize: 14,
  },
  changeTypeTextImproved: (colors) => ({
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  }),
  
  // Access Badge
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
    alignSelf: 'flex-start',
    gap: 6,
  },
  accessBadgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  toggleAccessButton: (colors) => ({
    paddingHorizontal: spacing.medium,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
    backgroundColor: `${colors.danger}1A`,
    alignSelf: 'flex-start',
  }),
  toggleAccessButtonImproved: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    gap: spacing.small,
    alignSelf: 'flex-start',
  }),
  toggleAccessText: {
    color: '#EF4444',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleAccessTextImproved: (colors) => ({
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  }),

  // Status
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: 8,
    borderRadius: borderRadius.medium,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 6,
  },
  statusBadgeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  statusDescription: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  }),
  noticeText: (colors) => ({
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.medium,
    paddingHorizontal: spacing.medium,
  }),
  
  // Permissions Card
  permissionsCard: (colors) => ({
    backgroundColor: `${colors.info}1A`,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    alignItems: 'center',
  }),
  permissionsIconContainer: (colors) => ({
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.medium,
  }),
  permissionsTitle: (colors) => ({
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  }),
  permissionsText: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  }),

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  modalContainer: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 40,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: `${colors.cardShadow} 0px 12px 40px, ${colors.cardShadow} 0px 4px 16px`,
      },
    }),
  }),
  modalHeader: (colors) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.large,
    paddingBottom: spacing.medium,
    borderBottomWidth: 0,
  }),
  modalTitle: (colors) => ({
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  }),
  modalCloseButton: {
    padding: spacing.small,
    borderRadius: borderRadius.small,
  },
  modalContent: {
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.medium,
  },
  modalActions: (colors) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.large,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.medium,
  }),
  modalCancelButton: (colors) => ({
    flex: 1,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    marginRight: spacing.small,
  }),
  modalCancelText: (colors) => ({
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  }),
  modalConfirmButton: (colors) => ({
    flex: 1,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginLeft: spacing.small,
  }),
  modalConfirmButtonDisabled: (colors) => ({
    backgroundColor: colors.disabled,
  }),
  modalConfirmText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Type option styles
  typeOption: (colors) => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.medium,
    marginBottom: spacing.small,
  }),
  typeOptionSelected: (colors) => ({
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 2,
  }),
  typeOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small / 2,
  },
  typeOptionContent: {
    flex: 1,
    paddingRight: spacing.medium,
  },
  typeOptionTitle: (colors) => ({
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  }),
  typeOptionSubtitle: (colors) => ({
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  }),
  typeOptionDescription: (colors) => ({
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  }),

  // Access option styles
  accessOption: (colors) => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.medium,
    marginBottom: spacing.small,
  }),
  accessOptionSelected: (colors) => ({
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 2,
  }),
  accessOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small / 2,
  },
  accessOptionContent: {
    flex: 1,
    paddingRight: spacing.medium,
  },
  accessOptionTitle: (colors) => ({
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  }),
  accessOptionDescription: (colors) => ({
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  }),

  // Column layout for better mobile experience
  valueWithActionColumn: {
    gap: spacing.medium,
  },

  // Improved edit field styles
  editFieldContainerImproved: (colors) => ({
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 48,
  }),
  editFieldImproved: (colors) => ({
    flex: 1,
    padding: spacing.medium,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 48,
    ...Platform.select({
      web: {
        outline: 'none',
        resize: 'none',
      },
    }),
  }),
  editActionsImproved: (colors) => ({
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }),
  editActionButtonImproved: (colors, type) => ({
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.medium,
    backgroundColor: type === 'save' ? colors.success + '10' : colors.danger + '10',
    borderRightWidth: type === 'cancel' ? 1 : 0,
    borderRightColor: colors.border,
  }),
  dangerCard: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.medium,
    borderWidth: 1,
    borderColor: colors.danger + '30',
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
  dangerCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.small,
  },
  dangerCardTitle: (colors) => ({
    fontSize: 18,
    fontWeight: '600',
    color: colors.danger,
  }),
  dangerCardDescription: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.medium,
  }),
  deleteUserButton: (colors) => ({
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
  deleteUserButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  messageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
});

export default UsersDetailsScreen;

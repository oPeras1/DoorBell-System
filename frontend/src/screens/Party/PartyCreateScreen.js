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
  KeyboardAvoidingView,
  TextInput,
  Image
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { createParty } from '../../services/partyService';
import { getAllUsers } from '../../services/userService';
import HousePlanSelector from '../../components/HousePlanSelector';
import PopUp from '../../components/PopUp';
import Message from '../../components/Message';
import Calendar from '../../components/Calendar';
import { PARTY_TYPE_CONFIG, ROOMS } from '../../constants/party';
import { useColors } from '../../hooks/useColors';
import { getLocalDate, formatLocalISOString } from '../../constants/functions';


const PARTY_TYPES = Object.entries(PARTY_TYPE_CONFIG).map(([key, value]) => ({
  key,
  label: value.name,
  icon: value.icon,
  color: value.color,
  gradient: value.gradient,
}));

const normalizeString = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .toLowerCase();
};

const PartyCreateScreen = ({ navigation, route }) => {
  const { user: currentUser } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dateTime: getLocalDate(),
    endDateTime: new Date(getLocalDate().getTime() + 2 * 60 * 60 * 1000),
    rooms: ['LIVING_ROOM'],
    type: 'HOUSE_PARTY',
    guests: []
  });
  
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState('start'); // 'start' or 'end'
  const [showRoomSelector, setShowRoomSelector] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedPopup, setShowUnsavedPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [guestSearch, setGuestSearch] = useState('');

  const colors = useColors();
  const styles = getStyles(colors);

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
      const users = await getAllUsers();
      const otherUsers = users.filter(user => user.id !== currentUser?.id);
      setAvailableUsers(otherUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setErrorMessage('Failed to load users');
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleDateTimeSelect = (selectedDate) => {
    if (datePickerType === 'start') {
      updateFormData('dateTime', selectedDate);
      const newEndTime = new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000);
      updateFormData('endDateTime', newEndTime);
    } else {
      updateFormData('endDateTime', selectedDate);
    }
    setShowDatePicker(false);
  };

  const openDatePicker = (type) => {
    setDatePickerType(type);
    setShowDatePicker(true);
  };

  const toggleGuest = (user) => {
    const isSelected = formData.guests.some(guest => guest.id === user.id);
    if (isSelected) {
      updateFormData('guests', formData.guests.filter(guest => guest.id !== user.id));
    } else {
      updateFormData('guests', [...formData.guests, user]);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setErrorMessage('Party name is required');
      return false;
    }
    if (formData.guests.length === 0) {
      setErrorMessage('At least one guest must be invited');
      return false;
    }
    if (!formData.rooms || formData.rooms.length === 0) {
      setErrorMessage('At least one room must be selected');
      return false;
    }
    if (formData.endDateTime <= formData.dateTime) {
      setErrorMessage('End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrorMessage('');

      const partyData = {
        ...formData,
        status: 'SCHEDULED',
        dateTime: formatLocalISOString(formData.dateTime),
        endDateTime: formatLocalISOString(formData.endDateTime),
        guests: formData.guests.map(guest => ({
          user: { id: guest.id },
          status: 'UNDECIDED'
        }))
      };

      await createParty(partyData);
      setHasUnsavedChanges(false);
      navigation.navigate('Party', { successMessage: 'Party created successfully!' });
    } catch (error) {
      console.error('Error creating party:', error);
      setErrorMessage(error.response?.data?.message || 'Failed to create party. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedPopup(true);
    } else {
      navigation.goBack();
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedRoom = ROOMS.find(room => room.key === formData.room);
  const selectedType = PARTY_TYPES.find(type => type.key === formData.type);

  const formatSelectedRooms = () => {
    if (!formData.rooms || formData.rooms.length === 0) {
      return 'Select Rooms';
    }
    
    if (formData.rooms.length === 1) {
      const room = ROOMS.find(r => r.key === formData.rooms[0]);
      return room ? room.label : 'Select Rooms';
    }
    
    if (formData.rooms.length <= 3) {
      return formData.rooms.map(roomKey => {
        const room = ROOMS.find(r => r.key === roomKey);
        return room ? room.label : roomKey;
      }).join(', ');
    }
    
    return `${formData.rooms.length} rooms selected`;
  };

  const getRoomsIcon = () => {
    if (!formData.rooms || formData.rooms.length === 0) {
      return 'home-outline';
    }
    
    if (formData.rooms.length === 1) {
      const room = ROOMS.find(r => r.key === formData.rooms[0]);
      return room ? room.icon : 'home-outline';
    }
    
    return 'business-outline';
  };

  const getRoomsColor = () => {
    if (!formData.rooms || formData.rooms.length === 0) {
      return colors.textSecondary;
    }
    
    if (formData.rooms.length === 1) {
      const room = ROOMS.find(r => r.key === formData.rooms[0]);
      return room ? room.color : colors.primary;
    }
    
    return colors.primary;
  };

  const isFormValid = formData.name.trim() && formData.guests.length > 0 && formData.rooms.length > 0;

  const filteredUsers = guestSearch
    ? availableUsers.filter(user =>
        normalizeString(user.username).includes(normalizeString(guestSearch))
      )
    : availableUsers;

  const getAvatarSource = (userType) => {
    if (userType === 'KNOWLEDGER') {
      return require('../../../assets/Avatar/avatarknowledger.jpg');
    }
    if (userType === 'HOUSER') {
      return require('../../../assets/Avatar/avatarhouser.png');
    }
    return require('../../../assets/Avatar/avatarguest.jpeg');
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Message 
            message={errorMessage}
            onDismiss={() => setErrorMessage('')}
            type="error"
          />
        </View>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        
        {/* Enhanced Header */}
        <Animated.View style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}>
          <View style={styles.headerBackground} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Create Party</Text>
              <Text style={styles.headerSubtitle}>Plan your perfect event</Text>
            </View>
            <TouchableOpacity 
              style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.saveButtonText}>Creating...</Text>
                </View>
              ) : (
                <Text style={[styles.saveButtonText, !isFormValid && styles.saveButtonTextDisabled]}>
                  Create
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[
              styles.formContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}>
              {/* Party Name */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Party Details</Text>
                </View>
                
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Party Name *</Text>
                  <TextInput
                    style={[styles.textInput, formData.name.trim() && styles.textInputFilled]}
                    placeholder="Enter party name"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.name}
                    onChangeText={(value) => updateFormData('name', value)}
                    maxLength={100}
                  />
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea, formData.description && styles.textInputFilled]}
                    placeholder="What's this party about?"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.description}
                    onChangeText={(value) => updateFormData('description', value)}
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              {/* Party Type */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="options-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Party Type</Text>
                </View>
                
                {Platform.OS === 'web' ? (
                  <View style={styles.typeGrid}>
                    {PARTY_TYPES.map((type) => {
                      const selected = formData.type === type.key;
                      return (
                        <TouchableOpacity
                          key={type.key}
                          style={[
                            styles.typeCard,
                            selected && styles.typeCardSelected,
                            selected && { backgroundColor: type.color, borderColor: type.color },
                            !selected && { borderColor: type.color }
                          ]}
                          onPress={() => updateFormData('type', type.key)}
                        >
                          <View style={[
                            styles.typeIconContainer,
                            selected
                              ? { backgroundColor: '#fff' }
                              : { backgroundColor: `${type.color}15` }
                          ]}>
                            <Ionicons 
                              name={type.icon} 
                              size={24}
                              color={type.color}
                            />
                          </View>
                          <Text style={[
                            styles.typeCardText,
                            selected && { color: '#fff' }
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeSelector}>
                    {PARTY_TYPES.map((type) => {
                      const selected = formData.type === type.key;
                      return (
                        <TouchableOpacity
                          key={type.key}
                          style={[
                            styles.typeOption,
                            selected && styles.typeOptionSelected,
                            selected && { backgroundColor: type.color, borderColor: type.color },
                            !selected && { borderColor: type.color }
                          ]}
                          onPress={() => updateFormData('type', type.key)}
                        >
                          <View style={[
                            styles.typeIconContainer,
                            selected
                              ? { backgroundColor: '#fff' }
                              : { backgroundColor: `${type.color}15` }
                          ]}>
                            <Ionicons 
                              name={type.icon} 
                              size={20}
                              color={type.color}
                            />
                          </View>
                          <Text style={[
                            styles.typeOptionText,
                            selected && { color: '#fff' }
                          ]}>
                            {type.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Date and Time */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Schedule</Text>
                </View>
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeField}>
                    <Text style={styles.fieldLabel}>Start</Text>
                    <TouchableOpacity 
                      style={styles.dateTimeButton}
                      onPress={() => openDatePicker('start')}
                    >
                      <Ionicons name="calendar" size={20} color={colors.primary} />
                      <Text style={styles.dateTimeText}>{formatDateTime(formData.dateTime)}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateTimeField}>
                    <Text style={styles.fieldLabel}>End</Text>
                    <TouchableOpacity 
                      style={styles.dateTimeButton}
                      onPress={() => openDatePicker('end')}
                    >
                      <Ionicons name="time" size={20} color={colors.primary} />
                      <Text style={styles.dateTimeText}>{formatDateTime(formData.endDateTime)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Room Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Location</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.roomButton}
                  onPress={() => setShowRoomSelector(true)}
                >
                  <View style={styles.roomButtonLeft}>
                    <View style={[styles.roomIconContainer, { backgroundColor: `${getRoomsColor()}15` }]}>
                      <Ionicons name={getRoomsIcon()} size={20} color={getRoomsColor()} />
                    </View>
                    <View>
                      <Text style={styles.roomButtonText}>{formatSelectedRooms()}</Text>
                      <Text style={styles.roomButtonSubtext}>
                        {formData.rooms.length > 1 ? 'Multiple rooms selected' : 'Tap to view house plan'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Guest Selection */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>
                    Guests ({formData.guests.length} selected)
                  </Text>
                </View>
                {/* Search for guests */}
                <View style={styles.fieldContainer}>
                  <TextInput
                    style={styles.guestSearchInput}
                    placeholder="Search guests..."
                    placeholderTextColor={colors.textSecondary}
                    value={guestSearch}
                    onChangeText={setGuestSearch}
                  />
                </View>
                <View style={styles.guestsList}>
                  {filteredUsers.map((user) => {
                    const isSelected = formData.guests.some(guest => guest.id === user.id);
                    return (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.guestItem, isSelected && styles.guestItemSelected]}
                        onPress={() => toggleGuest(user)}
                      >
                        <View style={styles.guestAvatar}>
                          <Image
                            source={getAvatarSource(user.type)}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: colors.primary,
                            }}
                            resizeMode="cover"
                          />
                        </View>
                        <View style={styles.guestInfo}>
                          <Text style={[
                            styles.guestName,
                            isSelected && styles.guestNameSelected
                          ]}>
                            {user.username}
                          </Text>
                          <Text style={styles.guestType}>{user.type || 'Guest'}</Text>
                        </View>
                        <View style={styles.guestAction}>
                          {isSelected ? (
                            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                          ) : (
                            <View style={styles.guestCheckbox} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                  {filteredUsers.length === 0 && (
                    <Text style={styles.noGuestsText}>No guests found.</Text>
                  )}
                </View>
              </View>
            </Animated.View>
          {/* Extra space at the end for better scrolling experience */}
            <View style={{ width: '100%', height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Custom Calendar */}
        <Calendar
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={handleDateTimeSelect}
          selectedDate={
            showDatePicker
              ? (datePickerType === 'start'
                  ? formData.dateTime
                  : formData.endDateTime)
              : getLocalDate()
          }
          minimumDate={datePickerType === 'start' ? getLocalDate() : formData.dateTime}
          title={datePickerType === 'start' ? 'Select Start Date & Time' : 'Select End Date & Time'}
        />

        {/* Room Selector Modal */}
        <HousePlanSelector
          visible={showRoomSelector}
          selectedRooms={formData.rooms}
          onRoomsSelect={(rooms) => { 
            updateFormData('rooms', rooms);
          }}
          onClose={() => setShowRoomSelector(false)}
          multiSelect={true}
        />

        {/* Unsaved Changes Popup */}
        <PopUp
          visible={showUnsavedPopup}
          title="Unsaved Changes"
          message="You have unsaved changes. Are you sure you want to leave?"
          confirmText="Leave"
          cancelText="Stay"
          type="warning"
          onConfirm={() => {
            setShowUnsavedPopup(false);
            navigation.goBack();
          }}
          onCancel={() => setShowUnsavedPopup(false)}
        />
      </View>
    </>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 25 : 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    pointerEvents: 'box-none',
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
  backButton: {
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
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButtonTextDisabled: {
    color: colors.background,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 120 : 140,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.xxLarge + 40,
  },
  formContainer: {
    gap: spacing.large,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        border: `1.5px solid ${colors.border}`,
        boxShadow: '0 2px 12px rgba(67,97,238,0.08), 0 1.5px 0px rgba(67,97,238,0.08)',
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.small,
  },
  fieldContainer: {
    marginBottom: spacing.medium,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    fontSize: 16,
    color: colors.textPrimary,
  },
  textInputFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  typeCard: {
    flex: 1,
    minWidth: '48%',
    padding: spacing.medium,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.background,
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(67,97,238,0.10)',
      },
    }),
  },
  typeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeCardText: {
    marginTop: spacing.small,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
  },
  typeOption: {
    alignItems: 'center',
    padding: spacing.medium,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    marginRight: spacing.small,
    backgroundColor: colors.background,
    minWidth: 120,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(67,97,238,0.10)',
      },
    }),
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.small,
  },
  webDateInput: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    fontSize: 14,
    color: colors.textPrimary,
    width: '100%',
    maxWidth: 260,
    marginTop: 4,
    marginBottom: 4,
    boxSizing: 'border-box',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  dateTimeField: {
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    gap: spacing.small,
  },
  dateTimeText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  roomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
  },
  roomButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  roomIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  roomButtonText: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  roomButtonSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  guestsList: {
    gap: spacing.small,
  },
  guestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
  },
  guestItemSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}08`,
  },
  guestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  guestAvatarText: {
    color: colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  guestNameSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  guestType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  guestAction: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  webDateRows: {
    flexDirection: 'column',
    gap: 12,
  },
  webDateRow: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  guestSearchInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  noGuestsText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.medium,
  },
});

export default PartyCreateScreen;
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
  KeyboardAvoidingView,
  RefreshControl,
  Image,
  Modal,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { 
  getPartyById, 
  updateGuestStatus, 
  updatePartyStatus, 
  addGuestToParty, 
  removeGuestFromParty,
  updatePartySchedule,
  updatePartyRooms
} from '../../services/partyService';
import HousePlanSelector from '../../components/HousePlanSelector';
import EditRoomsModal from '../../components/EditRoomsModal';
import { LinearGradient } from 'expo-linear-gradient';
import { PARTY_TYPE_CONFIG, STATUS_CONFIG, GUEST_STATUS_CONFIG } from '../../constants/party';
import { AuthContext } from '../../context/AuthContext';
import Message from '../../components/Message';
import { Picker } from '@react-native-picker/picker';
import { useColors } from '../../hooks/useColors';
import AddGuestModal from '../../components/AddGuestModal';
import PopUp from '../../components/PopUp';
import EditScheduleModal from '../../components/EditScheduleModal';
import { formatLocalISOString } from '../../constants/functions';

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

const PartyDetailsScreen = ({ navigation, route }) => {
  const { partyId } = route.params;
  const { user: currentUser } = useContext(AuthContext);

  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [party, setParty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [message, setMessage] = useState('');
  const [guestStatusLoading, setGuestStatusLoading] = useState({});
  const [guestStatusError, setGuestStatusError] = useState({});
  const [editingGuestId, setEditingGuestId] = useState(null);
  const [guestStatusPicker, setGuestStatusPicker] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [partyStatusLoading, setPartyStatusLoading] = useState(false);
  const [partyStatusError, setPartyStatusError] = useState('');
  const [editingPartyStatus, setEditingPartyStatus] = useState(false);
  const [partyStatusPicker, setPartyStatusPicker] = useState('');
  const [addGuestModalVisible, setAddGuestModalVisible] = useState(false);
  const [removeGuestConfirm, setRemoveGuestConfirm] = useState({ visible: false, guestId: null, guestName: '' });
  const [guestManagementLoading, setGuestManagementLoading] = useState(false);
  const [showGuestStatusModal, setShowGuestStatusModal] = useState(false);
  const [selectedGuestForStatus, setSelectedGuestForStatus] = useState(null);
  const [selectedGuestStatus, setSelectedGuestStatus] = useState(null);
  const [showPartyStatusModal, setShowPartyStatusModal] = useState(false);
  const [selectedPartyStatus, setSelectedPartyStatus] = useState(null);
  const [isEditScheduleModalVisible, setIsEditScheduleModalVisible] = useState(false);
  const [scheduleUpdateLoading, setScheduleUpdateLoading] = useState(false);
  const [isEditRoomsModalVisible, setIsEditRoomsModalVisible] = useState(false);
  const [roomsUpdateLoading, setRoomsUpdateLoading] = useState(false);
  const [roomsUpdateError, setRoomsUpdateError] = useState('');

  const colors = useColors();
  const styles = getStyles(colors);

  useEffect(() => {
    fetchPartyDetails();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: false }),
    ]).start();
  }, [partyId]);

  const fetchPartyDetails = async () => {
    try {
      setLoading(true);
      const data = await getPartyById(partyId);
      setParty(data);
    } catch (error) {
      console.error('Error fetching party details:', error);
      setErrorMessage('Failed to load party details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPartyDetails();
  }, [partyId]);

  // Update guest status locally, do not refetch
  const handleChangeGuestStatus = async (guestUserId, newStatus) => {
    setGuestStatusLoading(prev => ({ ...prev, [guestUserId]: true }));
    setGuestStatusError(prev => ({ ...prev, [guestUserId]: null }));
    try {
      await updateGuestStatus(party.id, guestUserId, newStatus);
      setParty(currentParty => {
        if (!currentParty) return null;
        const updatedGuests = currentParty.guests.map(guest => {
          if (guest.user.id === guestUserId) {
            return { ...guest, status: newStatus, updatedAt: new Date().toISOString() };
          }
          return guest;
        });
        return { ...currentParty, guests: updatedGuests };
      });
      setMessage('Guest status updated successfully!');
      setShowGuestStatusModal(false);
    } catch (err) {
      setGuestStatusError(prev => ({ ...prev, [guestUserId]: 'Error updating status.' }));
      setMessage('Error updating guest status.');
    } finally {
      setGuestStatusLoading(prev => ({ ...prev, [guestUserId]: false }));
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleBack = () => navigation.goBack();

  const formatDate = (dateTime) => {
    if (!dateTime) return null;
    const d = new Date(dateTime);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };
  const formatTime = (dateTime) => {
    if (!dateTime) return null;
    return new Date(dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getDuration = () => {
    if (!party?.dateTime || !party?.endDateTime) return '';
    const start = new Date(party.dateTime);
    const end = new Date(party.endDateTime);
    const diffMs = end - start;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.round((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    let durationString = '';
    if (hours > 0) durationString += `${hours}h `;
    if (minutes > 0) durationString += `${minutes}min`;
    return durationString.trim();
  };

  const formatRooms = () => {
    if (!party?.rooms || party.rooms.length === 0) return 'No rooms selected';
    const roomNames = {
      WC1: 'WC 1', WC2: 'WC 2', KITCHEN: 'Kitchen', LIVING_ROOM: 'Living Room',
      HUGO_B: "Hugo's Room", LEO_B: "Leo's Room", VIC_B: "Vic's Room",
      FILIPE_B: "Filipe's Room", GUI_B: "Guilherme's Room", BALCONY: 'Balcony'
    };
    if (party.rooms.length > 2) {
        return `${party.rooms.length} rooms selected`;
    }
    return party.rooms.map(room => roomNames[room] || room).join(', ');
  };

  const canEditGuestStatus = (guestUserId) => {
    if (!party || !currentUser) return false;
    const isHost = party.host?.id === currentUser.id;
    const isKnowledger = currentUser.type === 'KNOWLEDGER';
    const isSelf = currentUser.id === guestUserId;
    return isHost || isKnowledger || isSelf;
  };

  const canEditPartyStatus = () => {
    if (!party || !currentUser) return false;
    const isHost = party.host?.id === currentUser.id;
    const isKnowledger = currentUser.type === 'KNOWLEDGER';
    return isHost || isKnowledger;
  };

  const handleChangePartyStatus = async (newStatus) => {
    setPartyStatusLoading(true);
    setPartyStatusError('');
    try {
      const updatedParty = await updatePartyStatus(party.id, newStatus);
      setParty(updatedParty);
      setMessage('Party status updated successfully!');
      setEditingPartyStatus(false);
    } catch (err) {
      setPartyStatusError('Error updating party status.');
      setMessage('Error updating party status.');
    } finally {
      setPartyStatusLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getAvatarSource = (userType) => {
    if (userType === 'KNOWLEDGER') {
      return require('../../../assets/Avatar/avatarknowledger.jpg');
    }
    if (userType === 'HOUSER') {
      return require('../../../assets/Avatar/avatarhouser.png');
    }
    return require('../../../assets/Avatar/avatarguest.jpeg');
  };

  const canManageGuests = () => {
    if (!party || !currentUser) return false;
    const isHost = party.host?.id === currentUser.id;
    const isKnowledger = currentUser.type === 'KNOWLEDGER';
    return (isHost || isKnowledger) && (!currentUser.muted || isKnowledger);
  };

  const canEditSchedule = () => {
    if (!party || !currentUser) return false;
    const isHost = party.host?.id === currentUser.id;
    const isKnowledger = currentUser.type === 'KNOWLEDGER';
    return (isHost || isKnowledger) && (!currentUser.muted || isKnowledger);
  };

  const canEditRooms = () => {
    if (!party || !currentUser) return false;
    const isHost = party.host?.id === currentUser.id;
    const isKnowledger = currentUser.type === 'KNOWLEDGER';
    return (isHost || isKnowledger) && (!currentUser.muted || isKnowledger);
  };

  const handleAddGuest = async (guestUserId) => {
    setGuestManagementLoading(true);
    try {
      await addGuestToParty(party.id, guestUserId);
      await fetchPartyDetails(); // Refresh party data
      setMessage('Guest added successfully!');
    } catch (error) {
      console.error('Error adding guest:', error);
      setMessage('Error adding guest. Please try again.');
    } finally {
      setGuestManagementLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleRemoveGuest = async (guestUserId) => {
    setGuestManagementLoading(true);
    try {
      await removeGuestFromParty(party.id, guestUserId);
      await fetchPartyDetails(); // Refresh party data
      setMessage('Guest removed successfully!');
      setRemoveGuestConfirm({ visible: false, guestId: null, guestName: '' });
    } catch (error) {
      console.error('Error removing guest:', error);
      setMessage('Error removing guest. Please try again.');
    } finally {
      setGuestManagementLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleUpdateSchedule = async (newStartDate, newEndDate) => {
    setScheduleUpdateLoading(true);
    try {
      const start = formatLocalISOString(newStartDate);
      const end = formatLocalISOString(newEndDate);
      await updatePartySchedule(party.id, start, end);
      setIsEditScheduleModalVisible(false);
      setMessage('Schedule updated successfully!');
      await fetchPartyDetails(); // Reload party details
    } catch (error) {
      console.error('Error updating schedule:', error);
      throw error;
    } finally {
      setScheduleUpdateLoading(false);
    }
  };

  const handleUpdateRooms = async (newRooms) => {
    setRoomsUpdateLoading(true);
    setRoomsUpdateError('');
    try {
      await updatePartyRooms(party.id, newRooms);
      setIsEditRoomsModalVisible(false);
      setMessage('Rooms updated successfully!');
      await fetchPartyDetails(); // Reload party details
    } catch (error) {
      console.error('Error updating rooms:', error);
      setRoomsUpdateError(error?.response?.data?.message || 'Error updating rooms. Please try again.');
      throw error;
    } finally {
      setRoomsUpdateLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const confirmRemoveGuest = (guestId, guestName) => {
    setRemoveGuestConfirm({
      visible: true,
      guestId,
      guestName
    });
  };

  const openGuestStatusSelection = (guest) => {
    setSelectedGuestForStatus(guest);
    setSelectedGuestStatus(guest.status);
    setShowGuestStatusModal(true);
  };

  const confirmGuestStatusChange = () => {
    if (selectedGuestForStatus && selectedGuestStatus) {
      handleChangeGuestStatus(selectedGuestForStatus.user.id, selectedGuestStatus);
    }
  };

  const openPartyStatusSelection = () => {
    setSelectedPartyStatus(party.status);
    setShowPartyStatusModal(true);
  };

  const confirmPartyStatusChange = () => {
    if (selectedPartyStatus) {
      handleChangePartyStatus(selectedPartyStatus);
      setShowPartyStatusModal(false);
    }
  };

  const renderGuestsSection = () => {
    if (!party || !currentUser) return null;
    const hostAsAttendee = {
      isHost: true,
      user: party.host,
      status: 'HOST',
    };
    const allAttendees = [hostAsAttendee, ...(party.guests || [])];
    const totalAttendees = allAttendees.length;
    const canManage = canManageGuests();

    return (
      <View style={styles.attendeesSection}>
        <View style={styles.attendeesHeader}>
          <View style={styles.attendeesHeaderLeft}>
            <Ionicons name="people-circle" size={32} color={colors.primary} />
            <View>
              <Text style={styles.attendeesTitle}>Attendees</Text>
              <Text style={styles.attendeesSubtitle}>{totalAttendees} person(s) at the party</Text>
            </View>
          </View>
          {canManage && (
            <TouchableOpacity 
              style={styles.addGuestButton} 
              onPress={() => setAddGuestModalVisible(true)}
              disabled={guestManagementLoading}
            >
              <Ionicons name="person-add" size={20} color={colors.primary} />
              <Text style={styles.addGuestButtonText}>Add Guest</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.attendeesGridMobile}>
          {allAttendees.map((attendee) => {
            const isHost = attendee.isHost;
            const guest = isHost ? hostAsAttendee : attendee;
            const guestStatus = isHost ? null : (GUEST_STATUS_CONFIG[guest.status] || GUEST_STATUS_CONFIG.UNDECIDED);
            const isSelf = currentUser?.id === guest.user?.id;
            const editableGuest = !isHost && canEditGuestStatus(guest.user?.id);
            const canRemoveGuest = canManage && !isHost && !isSelf;

            let hostInfoText = '';
            if (isHost && isSelf) {
              hostInfoText = "You cannot be absent because you created this party.";
            } else if (isHost) {
              hostInfoText = "This user cannot be absent because they created this party.";
            }

            if (isHost) {
              const editableParty = canEditPartyStatus();
              const statusConfigLocal = STATUS_CONFIG[party.status] || STATUS_CONFIG.SCHEDULED;
              return (
                <View 
                  key={guest.user.id} 
                  style={[
                    styles.attendeeCardMobile,
                    styles.hostCardHighlight,
                    { borderColor: colors.primary }
                  ]}
                >
                  {(partyStatusLoading || partyStatusError) && (
                    <View style={styles.attendeeCardOverlay}>
                      {partyStatusLoading && <ActivityIndicator size="large" color={colors.primary} />}
                      {partyStatusError && <Ionicons name="alert-circle" size={48} color={colors.danger} />}
                    </View>
                  )}
                  <View style={styles.hostBanner}>
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.hostBannerText}>HOST</Text>
                  </View>
                  <View style={styles.attendeeAvatarContainer}>
                    <Image
                      source={getAvatarSource(guest.user?.type)}
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: colors.primary,
                      }}
                      resizeMode="cover"
                    />
                    <View style={[styles.attendeeStatusIcon, { backgroundColor: colors.primary }]}>
                      <Ionicons name="star" size={12} color="white" />
                    </View>
                  </View>
                  <Text style={styles.attendeeName} numberOfLines={1}>
                    {guest.user?.username} {isSelf && '(You)'}
                  </Text>
                  {hostInfoText !== '' && (
                    <Text style={styles.hostAutoAttendText}>
                      {hostInfoText}
                    </Text>
                  )}
                  <View style={styles.attendeeInteraction}>
                    {editableParty && (
                      <View style={[styles.statusDisplayChip, { backgroundColor: `${statusConfigLocal.color}20` }]}>
                        <Text style={[styles.statusDisplayText, { color: statusConfigLocal.color }]}>{statusConfigLocal.name}</Text>
                      </View>
                    )}
                    {editableParty && (
                      <TouchableOpacity 
                        style={styles.changeStatusButton} 
                        onPress={openPartyStatusSelection}
                      >
                        <Text style={styles.changeStatusButtonText}>Change Status</Text>
                        <Ionicons name="create-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {party.updatedAt && (
                    <Text style={styles.lastUpdatedText}>
                      Updated at: {new Date(party.updatedAt).toLocaleString()}
                    </Text>
                  )}
                </View>
              );
            }

            return (
              <View 
                key={guest.user.id} 
                style={[
                  styles.attendeeCardMobile,
                  isHost && styles.hostCardHighlight,
                  { borderColor: isHost ? colors.primary : guestStatus.color }
                ]}
              >
                {(guestStatusLoading[guest.user?.id] || guestStatusError[guest.user?.id] || guestManagementLoading) && (
                  <View style={styles.attendeeCardOverlay}>
                    {(guestStatusLoading[guest.user?.id] || guestManagementLoading) && <ActivityIndicator size="large" color={colors.primary} />}
                    {guestStatusError[guest.user?.id] && <Ionicons name="alert-circle" size={48} color={colors.danger} />}
                  </View>
                )}
                
                {canRemoveGuest && (
                  <TouchableOpacity 
                    style={styles.removeGuestButton}
                    onPress={() => confirmRemoveGuest(guest.user.id, guest.user.username)}
                    disabled={guestManagementLoading}
                    activeOpacity={0.7}
                  >
                    <View style={styles.removeGuestButtonInner}>
                      <Ionicons name="trash" size={16} color="white" />
                    </View>
                  </TouchableOpacity>
                )}

                {isHost && (
                  <View style={styles.hostBanner}>
                    <Ionicons name="star" size={12} color="#fff" />
                    <Text style={styles.hostBannerText}>HOST</Text>
                  </View>
                )}
                <View style={styles.attendeeAvatarContainer}>
                  <Image
                    source={getAvatarSource(guest.user?.type)}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: guestStatus.color,
                    }}
                    resizeMode="cover"
                  />
                  <View style={[styles.attendeeStatusIcon, { backgroundColor: isHost ? colors.primary : guestStatus.color }]}>
                    <Ionicons name={isHost ? 'star' : guestStatus.icon} size={12} color="white" />
                  </View>
                </View>
                <Text style={styles.attendeeName} numberOfLines={1}>
                  {guest.user?.username} {isSelf && !isHost && '(You)'}
                </Text>
                {hostInfoText !== '' && (
                  <Text style={styles.hostAutoAttendText}>
                    {hostInfoText}
                  </Text>
                )}

                <View style={styles.attendeeInteraction}>
                  {!isHost && (
                    <View style={[styles.statusDisplayChip, { backgroundColor: `${guestStatus.color}20` }]}>
                      <Text style={[styles.statusDisplayText, { color: guestStatus.color }]}>{guestStatus.name}</Text>
                    </View>
                  )}
                  {editableGuest && !isHost && (
                    <TouchableOpacity 
                      style={styles.changeStatusButton} 
                      onPress={() => openGuestStatusSelection(guest)}
                    >
                      <Text style={styles.changeStatusButtonText}>Change Status</Text>
                      <Ionicons name="create-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
                {guest.updatedAt && (
                  <Text style={styles.lastUpdatedText}>
                    Updated at: {new Date(guest.updatedAt).toLocaleString()}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        {(!party.guests || party.guests.length === 0) && (
          <View style={styles.noGuestsContainer}>
            <Ionicons name="person-add-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.noGuestsTitle}>No guests yet</Text>
            <Text style={styles.noGuestsSubtitle}>
              {canManage ? 'Tap "Add Guest" to invite people!' : 'Be the first to be invited!'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const typeConfig = party ? (PARTY_TYPE_CONFIG[party.type] || PARTY_TYPE_CONFIG.HOUSE_PARTY) : PARTY_TYPE_CONFIG.HOUSE_PARTY;
  const statusConfig = party ? (STATUS_CONFIG[party.status] || STATUS_CONFIG.SCHEDULED) : STATUS_CONFIG.SCHEDULED;

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <View style={styles.loadingIndicatorWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <Text style={styles.loadingText}>Loading party details...</Text>
      </View>
    );
  }

  if (!party) {
    return (
      <View style={styles.centeredContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.danger} style={{ marginBottom: spacing.large }} />
        <Text style={styles.errorTitle}>Failed to load party</Text>
        <Text style={styles.errorSubtitle}>{errorMessage || 'Could not load details for this party.'}</Text>
        <TouchableOpacity style={styles.errorButton} onPress={handleBack}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Message message={message} onDismiss={() => setMessage('')} type={message.includes('Error') || message.includes('Erro') ? 'error' : 'success'} />
      <EditScheduleModal
        visible={isEditScheduleModalVisible}
        onClose={() => setIsEditScheduleModalVisible(false)}
        onSave={handleUpdateSchedule}
        party={party}
      />
      <EditRoomsModal
        visible={isEditRoomsModalVisible}
        onClose={() => setIsEditRoomsModalVisible(false)}
        onSave={handleUpdateRooms}
        currentRooms={party?.rooms || []}
        loading={roomsUpdateLoading}
        error={roomsUpdateError}
      />
      <AddGuestModal
        visible={addGuestModalVisible}
        onClose={() => setAddGuestModalVisible(false)}
        onAddGuest={handleAddGuest}
        existingGuestIds={party?.guests?.map(g => g.user.id) || []}
        hostId={party?.host?.id}
      />
      <PopUp
        visible={removeGuestConfirm.visible}
        title="Remove Guest"
        message={`Are you sure you want to remove ${removeGuestConfirm.guestName} from this party?`}
        confirmText="Remove"
        cancelText="Cancel"
        onConfirm={() => handleRemoveGuest(removeGuestConfirm.guestId)}
        onCancel={() => setRemoveGuestConfirm({ visible: false, guestId: null, guestName: '' })}
        type="danger"
      />

      {/* Guest Status Selection Modal */}
      <Modal
        visible={showGuestStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGuestStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Guest Status</Text>
              <TouchableOpacity 
                onPress={() => setShowGuestStatusModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              
              {Object.entries(GUEST_STATUS_CONFIG).map(([statusKey, statusInfo]) => (
                <TouchableOpacity
                  key={statusKey}
                  style={[
                    styles.statusOption,
                    selectedGuestStatus === statusKey && styles.statusOptionSelected
                  ]}
                  onPress={() => setSelectedGuestStatus(statusKey)}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: statusInfo.color + '15' }]}>
                    <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
                  </View>
                  <View style={styles.statusOptionContent}>
                    <Text style={[styles.statusOptionTitle, { color: statusInfo.color }]}>
                      {statusInfo.name}
                    </Text>
                    <Text style={styles.statusOptionDescription}>
                      {statusKey === 'GOING' && 'Will attend the party'}
                      {statusKey === 'NOT_GOING' && 'Will not attend the party'}
                      {statusKey === 'UNDECIDED' && 'Has not decided yet'}
                    </Text>
                  </View>
                  {selectedGuestStatus === statusKey && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowGuestStatusModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton,
                  !selectedGuestStatus && styles.modalConfirmButtonDisabled
                ]}
                onPress={confirmGuestStatusChange}
                disabled={!selectedGuestStatus}
              >
                <Text style={styles.modalConfirmText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Party Status Selection Modal */}
      <Modal
        visible={showPartyStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPartyStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Party Status</Text>
              <TouchableOpacity 
                onPress={() => setShowPartyStatusModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {Object.entries(STATUS_CONFIG).map(([statusKey, statusInfo]) => (
                <TouchableOpacity
                  key={statusKey}
                  style={[
                    styles.statusOption,
                    selectedPartyStatus === statusKey && styles.statusOptionSelected
                  ]}
                  onPress={() => setSelectedPartyStatus(statusKey)}
                >
                  <View style={[styles.statusOptionIcon, { backgroundColor: statusInfo.color + '15' }]}>
                    <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
                  </View>
                  <View style={styles.statusOptionContent}>
                    <Text style={[styles.statusOptionTitle, { color: statusInfo.color }]}>
                      {statusInfo.name}
                    </Text>
                    <Text style={styles.statusOptionDescription}>
                      {statusKey === 'SCHEDULED' && 'Party is scheduled and planned'}
                      {statusKey === 'IN_PROGRESS' && 'Party is currently happening'}
                      {statusKey === 'COMPLETED' && 'Party has ended'}
                      {statusKey === 'CANCELLED' && 'Party has been cancelled'}
                    </Text>
                  </View>
                  {selectedPartyStatus === statusKey && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowPartyStatusModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalConfirmButton,
                  !selectedPartyStatus && styles.modalConfirmButtonDisabled
                ]}
                onPress={confirmPartyStatusChange}
                disabled={!selectedPartyStatus}
              >
                <Text style={styles.modalConfirmText}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
        <Animated.View style={[ styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] } ]}>
          <View style={styles.headerBackground} />
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>Party details</Text>
              <Text style={styles.headerSubtitle}>Everything to this party</Text>
            </View>
            <View style={styles.headerRight}>
              <GradientBackground
                colors={statusConfig.gradient || [statusConfig.color, statusConfig.color]}
                style={styles.headerStatusBadge}
              >
                <Ionicons name={statusConfig.icon} size={14} color="white" />
                <Text style={styles.headerStatusText}>{statusConfig.name}</Text>
              </GradientBackground>
            </View>
          </View>
        </Animated.View>
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
                progressViewOffset={Platform.OS === 'android' ? 120 : 140}
              />
            }
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], gap: spacing.large }}>
              <GradientBackground colors={typeConfig.gradient} style={styles.heroCard}>
                <View style={styles.heroContent}>
                  <View style={styles.heroHeader}>
                    <View style={styles.heroIconContainer}>
                      <Ionicons name={typeConfig.icon} size={32} color="white" />
                    </View>
                    <View style={styles.heroTitleBox}>
                      <Text style={styles.heroTitle}>{party.name}</Text>
                      <Text style={styles.heroType}>{typeConfig.name}</Text>
                    </View>
                  </View>

                  {party.description && (
                    <Text style={styles.heroDescription}>{party.description}</Text>
                  )}

                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <Ionicons name="people" size={18} color="white" />
                      <Text style={styles.heroStatText}>
                        {1 + (party.guests?.length || 0)} people
                      </Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Ionicons name="time" size={18} color="white" />
                      <Text style={styles.heroStatText}>{getDuration()}</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Ionicons name="location" size={18} color="white" />
                      <Text style={styles.heroStatText}>
                        {party.rooms?.length || 0} rooms
                      </Text>
                    </View>
                  </View>
                </View>
              </GradientBackground>

              {/* Timeline card */}
              <View style={styles.timelineCard}>
                <View style={styles.timelineHeader}>
                  <View style={styles.timelineHeaderContent}>
                    <Ionicons name="calendar" size={24} color={colors.primary} />
                    <Text style={styles.timelineTitle}>Schedule</Text>
                  </View>
                  {canEditSchedule() && (
                    <TouchableOpacity 
                      style={styles.editScheduleButton} 
                      onPress={() => setIsEditScheduleModalVisible(true)}
                    >
                      <Ionicons name="pencil" size={16} color={colors.primary} />
                      <Text style={styles.editScheduleButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.timelineContainer}>
                  <View style={styles.timelinePoint}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>START</Text>
                      <Text style={styles.timelineDate}>{formatDate(party.dateTime)}</Text>
                      <Text style={styles.timelineTime}>{formatTime(party.dateTime)}</Text>
                    </View>
                  </View>
                  <View style={styles.timelineMiddle}>
                    <View style={styles.timelineLine} />
                    <View style={styles.durationContainer}>
                      <Text style={styles.durationText}>{getDuration()}</Text>
                    </View>
                  </View>
                  <View style={styles.timelinePoint}>
                    <View style={[styles.timelineDot, { backgroundColor: colors.textSecondary }]} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineLabel}>END</Text>
                      <Text style={styles.timelineDate}>{formatDate(party.endDateTime)}</Text>
                      <Text style={styles.timelineTime}>{formatTime(party.endDateTime)}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* People card */}
              {renderGuestsSection()}

              {/* Location Card */}
              <View style={styles.locationCard}>
                <View style={styles.locationHeader}>
                  <View style={styles.locationHeaderLeft}>
                    <Ionicons name="home" size={24} color={colors.primary} />
                    <View style={styles.locationHeaderText}>
                      <Text style={styles.locationTitle}>Location</Text>
                      <Text style={styles.locationSubtitle}>{formatRooms()}</Text>
                    </View>
                  </View>
                  {canEditRooms() && (
                    <TouchableOpacity 
                      style={styles.editRoomsButton} 
                      onPress={() => setIsEditRoomsModalVisible(true)}
                    >
                      <Ionicons name="pencil" size={16} color={colors.primary} />
                      <Text style={styles.editRoomsButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <View style={styles.housePlanContainer}>
                  <HousePlanSelector
                    visible={true}
                    selectedRooms={party.rooms || []}
                    onRoomsSelect={() => {}}
                    onClose={() => {}}
                    multiSelect={true}
                    viewOnly={true}
                  />
                </View>
              </View>

            </Animated.View>
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
  );
};


const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.large,
    backgroundColor: colors.background,
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
  headerBackButton: {
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

  scrollView: { flex: 1 },
  scrollContent: {
    paddingTop: 100,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.small,
  },

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
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleBox: { flex: 1 },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  heroType: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  heroDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
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

  timelineCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { border: `1px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(67,97,238,0.08)' },
    }),
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    marginBottom: spacing.large,
    justifyContent: 'space-between',
    width: '100%',
  },
  timelineHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  editScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
  },
  editScheduleButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.medium,
    gap: spacing.medium,
    width: '100%',
  },
  timelinePoint: {
    alignItems: 'center',
    flex: 1,
    minWidth: 90,
    justifyContent: 'center',
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginBottom: spacing.small,
  },
  timelineContent: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
    width: '100%',
  },
  timelineLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textSecondary,
    letterSpacing: 1,
    textAlign: 'center',
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  timelineTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    width: '100%',
  },
  timelineMiddle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    position: 'relative',
  },
  timelineLine: {
    height: 2,
    width: '100%',
    backgroundColor: colors.border,
    marginBottom: 5,
    marginTop: 5,
  },
  durationContainer: {
    position: 'absolute',//
    top: Platform.OS === 'web' ? '35%' : '15%', 
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: Platform.OS === 'web' ? -30 : -40 }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    backgroundColor: 'transparent',
  },
  durationText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
  },

  peopleCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 20px rgba(67,97,238,0.08)',
      },
    }),
  },
  peopleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peopleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  peopleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  peopleTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  peopleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  attendeeBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 60,
  },
  attendeeCount: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  attendeeLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  // Host Spotlight
  hostSpotlight: {
    backgroundColor: `${colors.primary}08`,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    borderWidth: 1,
    borderColor: `${colors.primary}20`,
  },
  hostSpotlightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
    gap: spacing.small,
  },
  crownIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostSpotlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    gap: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  hostAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 22,
  },
  hostInfo: { 
    flex: 1,
    marginLeft: spacing.small,
  },
  hostName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  hostLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hostBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  hostBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Guest Status Overview
  guestStatusOverview: {
    backgroundColor: `${colors.background}80`,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
  },
  guestStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  statusPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.small,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },

  // Guests Section
  attendeesSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.large,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 4 },
      web: { border: `1px solid ${colors.border}`, boxShadow: '0 4px 20px rgba(67,97,238,0.08)' },
    }),
  },
  attendeesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  attendeesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  attendeesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  attendeesSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  attendeesGridMobile: {
    flexDirection: 'column',
    gap: spacing.medium,
    justifyContent: 'flex-start',
    width: '100%',
  },
  attendeeCard: {
    width: Platform.OS === 'web' ? 'calc(50% - 8px)' : '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: spacing.small,
    position: 'relative',
  },
  attendeeCardMobile: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: spacing.small,
    position: 'relative',
    maxWidth: 520,
    alignSelf: 'center',
  },
  hostCardHighlight: {
    backgroundColor: `${colors.primary}0D`,
    width: '100%',
  },
  hostBanner: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.small,
  },
  hostBannerText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  attendeeCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    zIndex: 10,
    borderRadius: borderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeAvatarContainer: {
    position: 'relative',
    marginTop: spacing.small,
  },
  attendeeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendeeAvatarText: {
    fontSize: 28,
    color: 'white',
    fontWeight: 'bold',
  },
  attendeeStatusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F8FAFC',
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.small,
  },
  attendeeInteraction: {
    width: '100%',
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusDisplayChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusDisplayText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  changeStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.small,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.small,
  },
  changeStatusButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  editModeContainer: {
    width: '100%',
    gap: spacing.medium,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editModeContainerMobile: {
    width: '100%',
    gap: spacing.medium,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  pickerContainer: {
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
    flex: 1,
  },
  pickerContainerMobile: {
    borderRadius: borderRadius.small,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
    marginBottom: spacing.small,
    minHeight: 48,
    justifyContent: 'center',
    width: '100%',
    maxHeight: 180,
  },
  statusPicker: {
    height: 40,
    width: '100%',
  },
  statusPickerMobile: {
    height: 60,
    width: '100%',
    fontSize: 18,
    minHeight: 60,
    maxHeight: 180, 
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.medium,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 18,
    backgroundColor: colors.border,
  },
  updateButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lastUpdatedText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: spacing.small,
  },
  noGuestsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxLarge,
    gap: spacing.medium,
  },
  noGuestsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  noGuestsSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -spacing.small,
  },

  locationCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.large,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 20px rgba(67,97,238,0.08)',
      },
    }),
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%', // garantir que ocupa toda a largura
    gap: spacing.small, // igual ao timelineHeader
    marginBottom: 0, // garantir consistência
  },
  locationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
    flex: 1, // garantir que o texto ocupa o espaço disponível
    minWidth: 0, // evitar overflow
  },
  locationHeaderText: { flex: 1 },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  locationSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editRoomsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
  },
  editRoomsButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  housePlanContainer: {
    height: 320,
    borderRadius: borderRadius.medium,
    overflow: 'hidden',
  },

  loadingCard: {
    backgroundColor: colors.card,
    padding: spacing.xxLarge,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    gap: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    }),
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorCard: {
    backgroundColor: colors.card,
    padding: spacing.xxLarge,
    borderRadius: borderRadius.large,
    alignItems: 'center',
    gap: spacing.large,
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
      web: { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    }),
  },
  errorIconContainer: {
    backgroundColor: '#FEE2E2',
    padding: spacing.large,
    borderRadius: 50,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    marginTop: spacing.xxlarge,
  },
  errorButtonText: {
    color: colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    alignSelf: 'center',
  },
  updateStatusButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  hostAutoAttendText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingIndicatorWrapper: {
    marginTop: 120,
    marginBottom: spacing.large,
  },
  refreshButton: {
    marginTop: spacing.large,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    alignSelf: 'center',
  },
  refreshButtonText: {
    color: colors.card,
    fontWeight: '600',
    fontSize: 16,
  },
  addGuestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
  },
  addGuestButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  removeGuestButton: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 5,
  },
  removeGuestButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 2px 8px ${colors.danger}40`,
      },
    }),
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.large,
  },
  modalContainer: {
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
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.large,
    paddingBottom: spacing.medium,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  modalCloseButton: {
    padding: spacing.small,
    borderRadius: borderRadius.small,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.large,
    textAlign: 'center',
  },
  modalContent: {
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.medium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.large,
    paddingTop: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.medium,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    marginRight: spacing.small,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 16,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginLeft: spacing.small,
  },
  modalConfirmButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },

  // Status option styles
  statusOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.medium,
    marginBottom: spacing.small,
  },
  statusOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
    borderWidth: 2,
  },
  statusOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small / 2,
  },
  statusOptionContent: {
    flex: 1,
    paddingRight: spacing.medium,
  },
  statusOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusOptionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default PartyDetailsScreen;
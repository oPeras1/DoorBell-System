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
  RefreshControl,
  Alert,
  ActivityIndicator,
  Dimensions,
  TextInput
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TopField from '../../components/TopField';
import { getParties, deleteParty } from '../../services/partyService';
import { getMe } from '../../services/userService';
import PopUp from '../../components/PopUp';
import Message from '../../components/Message';
import Calendar from '../../components/Calendar';
import { PARTY_TYPE_CONFIG, ROOM_CONFIG, STATUS_CONFIG } from '../../constants/party';

const SCREEN_WIDTH = Dimensions.get('window').width;

const PartyCard = ({ party, userRole, onDelete, onPress }) => {
  const [cardAnim] = useState(new Animated.Value(0));
  const typeConfig = PARTY_TYPE_CONFIG[party.type] || PARTY_TYPE_CONFIG.HOUSE_PARTY;
  const statusConfig = STATUS_CONFIG[party.status] || STATUS_CONFIG.SCHEDULED;

  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, []);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'No date';
    const date = new Date(dateTime);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    if (!party.dateTime || !party.endDateTime) return '';
    const start = new Date(party.dateTime);
    const end = new Date(party.endDateTime);
    const hours = Math.round((end - start) / (1000 * 60 * 60));
    return `${hours}h`;
  };

  const canDelete = () => {
    // Allow host or KNOWLEDGER to delete
    return userRole && userRole.type !== 'GUEST' &&
      (party.host && party.host.id === userRole.id || userRole.type === 'KNOWLEDGER');
  };

  const formatRooms = () => {
    if (!party.rooms || party.rooms.length === 0) {
      if (party.room) {
        const roomConfig = ROOM_CONFIG[party.room];
        return roomConfig ? roomConfig.name : party.room;
      }
      return 'No rooms selected';
    }
    
    if (party.rooms.length === 1) {
      const roomConfig = ROOM_CONFIG[party.rooms[0]];
      return roomConfig ? roomConfig.name : party.rooms[0];
    }
    
    if (party.rooms.length <= 3) {
      return party.rooms.map(room => {
        const roomConfig = ROOM_CONFIG[room];
        return roomConfig ? roomConfig.name : room;
      }).join(', ');
    }
    
    return `${party.rooms.length} rooms selected`;
  };

  const getRoomIcon = () => {
    if (!party.rooms || party.rooms.length === 0) {
      // Fallback for old single room format
      if (party.room) {
        const roomConfig = ROOM_CONFIG[party.room];
        return roomConfig ? roomConfig.icon : 'home';
      }
      return 'home';
    }
    
    if (party.rooms.length === 1) {
      const roomConfig = ROOM_CONFIG[party.rooms[0]];
      return roomConfig ? roomConfig.icon : 'home';
    }
    
    return 'business'; // Multiple rooms icon
  };

  const getRoomColor = () => {
    if (!party.rooms || party.rooms.length === 0) {
      // Fallback for old single room format
      if (party.room) {
        const roomConfig = ROOM_CONFIG[party.room];
        return roomConfig ? roomConfig.color : colors.primary;
      }
      return colors.primary;
    }
    
    if (party.rooms.length === 1) {
      const roomConfig = ROOM_CONFIG[party.rooms[0]];
      return roomConfig ? roomConfig.color : colors.primary;
    }
    
    return colors.primary; // Default color for multiple rooms
  };

  return (
    <Animated.View style={[
      styles.partyCard,
      {
        opacity: cardAnim,
        transform: [{ scale: cardAnim }]
      }
    ]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.typeIcon, { backgroundColor: typeConfig.bgColor }]}>
              <Ionicons name={typeConfig.icon} size={20} color={typeConfig.color} />
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.cardTitle} numberOfLines={1}>{party.name}</Text>
              <Text style={styles.cardSubtitle}>{typeConfig.name}</Text>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <Ionicons name={statusConfig.icon} size={12} color="white" />
              <Text style={styles.statusText}>{statusConfig.name}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          {party.description && (
            <Text style={styles.description} numberOfLines={2}>{party.description}</Text>
          )}
          
          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>{formatDateTime(party.dateTime)}</Text>
              {getDuration() && (
                <Text style={styles.duration}>({getDuration()})</Text>
              )}
            </View>
            
            <View style={styles.detailRow}>
              <Ionicons name={getRoomIcon()} size={16} color={getRoomColor()} />
              <Text style={styles.detailText}>{formatRooms()}</Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.detailText}>
                {party.guests ? `${party.guests.length} guests` : 'No guests'}
              </Text>
            </View>

            {party.host && (
              <View style={styles.detailRow}>
                <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.detailText}>Host: {party.host.username}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Footer: View Details and Delete */}
        <View style={styles.cardFooter}>
          <View style={styles.cardFooterActions}>
            {canDelete() && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => onDelete(party.id)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.detailsButton} 
              onPress={() => onPress()}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsButtonText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const normalizeString = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/\s+/g, '') // remove spaces
    .toLowerCase();
};

const PartyScreen = ({ navigation, route }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPastParties, setShowPastParties] = useState(false);
  const [popUpVisible, setPopUpVisible] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDateFromPicker, setShowDateFromPicker] = useState(false);
  const [showDateToPicker, setShowDateToPicker] = useState(false);

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

  const checkAuth = async () => {
    try {
      await getMe();
    } catch (error) {
      if (error.response && error.response.status === 404) {
        await logout();
        return false;
      }
    }
    return true;
  };

  const fetchParties = async () => {
    const isLogged = await checkAuth();
    if (!isLogged) return;
    try {
      const data = await getParties();
      setParties(data || []);
    } catch (error) {
      console.error('Error fetching parties:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteParty = (partyId) => {
    setPartyToDelete(partyId);
    setPopUpVisible(true);
  };

  const confirmDeleteParty = async () => {
    if (!partyToDelete) return;
    try {
      await deleteParty(partyToDelete);
      setParties(prev => prev.filter(p => p.id !== partyToDelete));
    } catch (error) {
      // Opcional
    } finally {
      setPopUpVisible(false);
      setPartyToDelete(null);
    }
  };

  const cancelDeleteParty = () => {
    setPopUpVisible(false);
    setPartyToDelete(null);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchParties();
  };

  const filterParties = () => {
    const now = new Date();

    if (currentUser?.type === 'KNOWLEDGER') {
      if (showPastParties) {
        // Past parties: endDateTime < now
        return parties.filter(party =>
          party.endDateTime && new Date(party.endDateTime) < now
        );
      } else {
        // Active parties: endDateTime >= now (includes future and ongoing)
        return parties.filter(party =>
          party.endDateTime && new Date(party.endDateTime) >= now
        );
      }
    }

    return parties;
  };

  const canCreateParty = () => {
    return currentUser?.type === 'HOUSER' || currentUser?.type === 'KNOWLEDGER';
  };

  const getHeaderTitle = () => {
    if (currentUser?.type === 'KNOWLEDGER') {
      return showPastParties ? 'Past Parties' : 'Active Parties';
    } else if (currentUser?.type === 'HOUSER') {
      return 'Active Parties';
    } else {
      return 'My Invitations';
    }
  };  

  useEffect(() => {
    fetchParties();
    
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
    if (route?.params?.successMessage) {
      setSuccessMessage(route.params.successMessage);
      navigation.setParams({ successMessage: undefined });
    }
  }, [route?.params?.successMessage]);

  const filteredParties = filterParties()
    .filter(party => {
      if (partySearch) {
        if (!normalizeString(party.name).includes(normalizeString(partySearch))) {
          return false;
        }
      }
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        if (party.dateTime && new Date(party.dateTime) < fromDate) return false;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        if (party.dateTime && new Date(party.dateTime) > toDate) return false;
      }
      return true;
    });

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.messageContainer}>
          <Message
            message={successMessage}
            onDismiss={() => setSuccessMessage('')}
            type="success"
          />
        </View>
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
                progressViewOffset={Platform.OS === 'android' ? 80 : 95} 
              />
            }
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.headerContent}>
                <Text style={styles.pageTitle}>{getHeaderTitle()}</Text>
                <Text style={styles.pageSubtitle}>
                  {filteredParties.length} {filteredParties.length === 1 ? 'party' : 'parties'}
                </Text>
              </View>
              
              <View style={styles.headerActions}>
                {currentUser?.type === 'KNOWLEDGER' && (
                  <TouchableOpacity 
                    style={[styles.filterButton, showPastParties && styles.filterButtonActive]}
                    onPress={() => setShowPastParties(!showPastParties)}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={showPastParties ? "time" : "calendar"} 
                      size={16} 
                      color={showPastParties ? colors.card : colors.primary} 
                    />
                    <Text style={[
                      styles.filterButtonText, 
                      showPastParties && styles.filterButtonTextActive
                    ]}>
                      {showPastParties ? 'Past' : 'Active'}
                    </Text>
                  </TouchableOpacity>
                )}
                
                {canCreateParty() && filteredParties.length > 0 && (
                  <TouchableOpacity 
                    style={styles.createButton} 
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PartyCreate')}
                  >
                    <Ionicons name="add" size={20} color={colors.card} />
                    <Text style={styles.createButtonText}>Create</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Search and filters */}
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Ionicons name="filter-outline" size={20} color={colors.primary} />
                <Text style={styles.filterTitle}>Filters</Text>
              </View>
              
              <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search party name..."
                    placeholderTextColor={colors.textSecondary}
                    value={partySearch}
                    onChangeText={setPartySearch}
                  />
                  {partySearch.length > 0 && (
                    <TouchableOpacity onPress={() => setPartySearch('')}>
                      <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.dateFiltersContainer}>
                <Text style={styles.dateFilterLabel}>Date Range</Text>
                <View style={styles.dateInputsRow}>
                  <View style={styles.dateInputWrapper}>
                    <TouchableOpacity
                      style={styles.dateInputContainer}
                      onPress={() => setShowDateFromPicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                      <Text style={styles.dateInputText}>
                        {dateFrom ? formatDate(dateFrom) : 'From'}
                      </Text>
                      {dateFrom.length > 0 && (
                        <TouchableOpacity onPress={() => setDateFrom('')}>
                          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dateInputWrapper}>
                    <TouchableOpacity
                      style={styles.dateInputContainer}
                      onPress={() => setShowDateToPicker(true)}
                    >
                      <Ionicons name="calendar" size={18} color={colors.textSecondary} />
                      <Text style={styles.dateInputText}>
                        {dateTo ? formatDate(dateTo) : 'To'}
                      </Text>
                      {dateTo.length > 0 && (
                        <TouchableOpacity onPress={() => setDateTo('')}>
                          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                
                {(partySearch || dateFrom || dateTo) && (
                  <TouchableOpacity 
                    style={styles.clearFiltersButton}
                    onPress={() => {
                      setPartySearch('');
                      setDateFrom('');
                      setDateTo('');
                    }}
                  >
                    <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                    <Text style={styles.clearFiltersText}>Clear all filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Calendars for date filtering */}
            <Calendar
              visible={showDateFromPicker}
              onClose={() => setShowDateFromPicker(false)}
              onDateSelect={date => {
                setDateFrom(date.toISOString());
                setShowDateFromPicker(false);
              }}
              selectedDate={dateFrom ? new Date(dateFrom) : new Date()}
              minimumDate={null}
              title="Select Start Date"
            />
            <Calendar
              visible={showDateToPicker}
              onClose={() => setShowDateToPicker(false)}
              onDateSelect={date => {
                setDateTo(date.toISOString());
                setShowDateToPicker(false);
              }}
              selectedDate={dateTo ? new Date(dateTo) : new Date()}
              minimumDate={dateFrom ? new Date(dateFrom) : null}
              title="Select End Date"
            />

            {/* Content */}
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading parties...</Text>
              </View>
            ) : filteredParties.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
                </View>
                <Text style={styles.emptyTitle}>
                  {partySearch || dateFrom || dateTo
                    ? 'No parties match your filters'
                    : showPastParties
                      ? 'No Past Parties'
                      : 'No Parties Yet'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {partySearch || dateFrom || dateTo
                    ? "Try adjusting your search or date filters."
                    : currentUser?.type === 'GUEST'
                      ? "You haven't been invited to any parties yet"
                      : showPastParties
                        ? "No parties have been completed yet"
                        : "Create your first party to get started!"
                  }
                </Text>
                
                {canCreateParty() && !showPastParties && !(partySearch || dateFrom || dateTo) && (
                  <TouchableOpacity 
                    style={styles.emptyCreateButton} 
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('PartyCreate')}
                  >
                    <Ionicons name="add-circle" size={20} color={colors.primary} />
                    <Text style={styles.emptyCreateButtonText}>Create Party</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.partiesContainer}>
                {filteredParties.map((party, index) => (
                  <PartyCard
                    key={party.id}
                    party={party}
                    userRole={currentUser}
                    onDelete={handleDeleteParty}
                    onPress={() => navigation.navigate('PartyDetails', { partyId: party.id })}
                  />
                ))}
              </View>
            )}
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
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Users')}
          >
            <Ionicons name="people-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.primary }]}>Party</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <PopUp
          visible={popUpVisible}
          title="Delete Party"
          message="Are you sure you want to delete this party?"
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDeleteParty}
          onCancel={cancelDeleteParty}
          showCancel={true}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  messageContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 25 : 0,
    left: 0,
    right: 0,
    zIndex: 2000,
    pointerEvents: 'box-none',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 100 : 115,
    paddingHorizontal: spacing.large,
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.large,
    gap: spacing.medium,
  },
  headerContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: spacing.small,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: colors.card,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderRadius: borderRadius.medium,
    gap: spacing.small,
  },
  createButtonText: {
    color: colors.card,
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxlarge,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Dimensions.get('window').height * 0.50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxLarge,
    paddingHorizontal: spacing.large,
    minHeight: Dimensions.get('window').height * 0.50,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${colors.textSecondary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.large,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.large,
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    backgroundColor: `${colors.primary}10`,
    gap: spacing.small,
  },
  emptyCreateButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  partiesContainer: {
    gap: spacing.small,
  },
  partyCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    marginBottom: spacing.medium,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        border: `1.5px solid ${colors.border}`,
        boxShadow: '0 2px 12px rgba(67,97,238,0.08), 0 1.5px 0px rgba(67,97,238,0.08)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.medium,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  cardHeaderRight: {
    alignItems: 'flex-end',
    gap: spacing.small,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    marginBottom: spacing.medium,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.medium,
  },
  cardDetails: {
    gap: spacing.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
  },
  detailText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  duration: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cardFooter: {
    alignItems: 'flex-end',
    marginTop: spacing.small,
  },
  cardFooterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.medium,
  },
  deleteButton: {
    padding: spacing.small,
    borderRadius: borderRadius.small,
    backgroundColor: `${colors.danger}10`,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.small,
    paddingVertical: spacing.small,
  },
  detailsButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
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
    ...(Platform.OS === 'ios'
      ? {
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }
      : {
          elevation: 8,
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
  filterSection: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    marginBottom: spacing.large,
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
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.small,
  },
  searchContainer: {
    marginBottom: spacing.large, 
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    height: 48,
    gap: spacing.small,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  dateFiltersContainer: {
    gap: spacing.medium, 
  },
  dateFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: spacing.small,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    height: 48,
    gap: spacing.small,
  },
  dateInputText: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    marginTop: spacing.small,
    gap: spacing.small,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
});

export default PartyScreen;

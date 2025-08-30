import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { getLogs, getLogsCount } from '../../services/logService';
import { getAllUsers } from '../../services/userService';
import LogItem from '../../components/LogItem';
import Message from '../../components/Message';
import InputField from '../../components/InputField';
import {
  LOG_TYPE_OPTIONS,
  DATE_FILTER_OPTIONS,
  getLogTypeConfig,
} from '../../constants/logs';

const LogsScreen = ({ navigation }) => {
  const { user: currentUser } = useContext(AuthContext);
  const colors = useColors();
  
  // State management
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [users, setUsers] = useState([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [selectedLogTypes, setSelectedLogTypes] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [customDateStart, setCustomDateStart] = useState('');
  const [customDateEnd, setCustomDateEnd] = useState('');
  
  // Modal states
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showUserFilter, setShowUserFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Message state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  
  // Animation states
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const styles = getStyles(colors);

  // Check if user is Knowledger
  useEffect(() => {
    if (currentUser?.type !== 'KNOWLEDGER') {
      navigation.goBack();
      return;
    }
  }, [currentUser]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: false }),
    ]).start();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    applyFilters();
  }, [logs, searchText, selectedLogTypes, selectedUsers, selectedDateFilter, customDateStart, customDateEnd]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchLogs(true), fetchUsers(), fetchLogsCount()]);
    } catch (error) {
      setMessage('Failed to load logs data');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async (reset = false) => {
    try {
      const page = reset ? 0 : currentPage;
      const response = await getLogs(page, 100);
      
      if (reset) {
        setLogs(response.content);
        setCurrentPage(0);
      } else {
        setLogs(prev => [...prev, ...response.content]);
      }
      
      setHasMorePages(!response.last);
      setCurrentPage(reset ? 1 : currentPage + 1);
    } catch (error) {
      setMessage('Failed to fetch logs');
      setMessageType('error');
      throw error;
    }
  };

  const fetchUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchLogsCount = async () => {
    try {
      const count = await getLogsCount();
      setTotalLogsCount(count);
    } catch (error) {
      console.error('Failed to fetch logs count:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(search) ||
        log.username.toLowerCase().includes(search)
      );
    }

    // Log type filter
    if (selectedLogTypes.length > 0) {
      filtered = filtered.filter(log =>
        selectedLogTypes.includes(log.logType)
      );
    }

    // User filter
    if (selectedUsers.length > 0) {
      filtered = filtered.filter(log =>
        selectedUsers.includes(log.username)
      );
    }

    // Date filter
    if (selectedDateFilter !== 'all') {
      const now = new Date();
      let startDate = null;
      let endDate = new Date(now);

      switch (selectedDateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
          endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
          break;
        case 'last7days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last30days':
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'custom':
          if (customDateStart) {
            startDate = new Date(customDateStart);
          }
          if (customDateEnd) {
            endDate = new Date(customDateEnd);
            endDate.setHours(23, 59, 59, 999);
          }
          break;
      }

      if (startDate) {
        filtered = filtered.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && (!endDate || logDate <= endDate);
        });
      }
    }

    setFilteredLogs(filtered);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchLogs(true), fetchLogsCount()]);
    } catch (error) {
      // Error handled in fetchLogs
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMorePages) return;
    
    setLoadingMore(true);
    try {
      await fetchLogs(false);
    } catch (error) {
      // Error handled in fetchLogs
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMorePages, currentPage]);

  const clearAllFilters = () => {
    setSearchText('');
    setSelectedLogTypes([]);
    setSelectedUsers([]);
    setSelectedDateFilter('all');
    setCustomDateStart('');
    setCustomDateEnd('');
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchText.trim()) count++;
    if (selectedLogTypes.length > 0) count++;
    if (selectedUsers.length > 0) count++;
    if (selectedDateFilter !== 'all') count++;
    return count;
  };

  const renderLogItem = ({ item }) => <LogItem log={item} />;

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <InputField
          placeholder="Search logs or users..."
          value={searchText}
          onChangeText={setSearchText}
          icon={<Ionicons name="search" size={20} color={colors.primary} />}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.filterButton(selectedLogTypes.length > 0)}
            onPress={() => setShowTypeFilter(true)}
          >
            <Ionicons name="funnel" size={16} color={selectedLogTypes.length > 0 ? colors.primary : colors.textSecondary} />
            <Text style={styles.filterButtonText(selectedLogTypes.length > 0)}>
              Type {selectedLogTypes.length > 0 && `(${selectedLogTypes.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton(selectedUsers.length > 0)}
            onPress={() => setShowUserFilter(true)}
          >
            <Ionicons name="people" size={16} color={selectedUsers.length > 0 ? colors.primary : colors.textSecondary} />
            <Text style={styles.filterButtonText(selectedUsers.length > 0)}>
              User {selectedUsers.length > 0 && `(${selectedUsers.length})`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton(selectedDateFilter !== 'all')}
            onPress={() => setShowDateFilter(true)}
          >
            <Ionicons name="calendar" size={16} color={selectedDateFilter !== 'all' ? colors.primary : colors.textSecondary} />
            <Text style={styles.filterButtonText(selectedDateFilter !== 'all')}>
              Date
            </Text>
          </TouchableOpacity>

          {getActiveFilterCount() > 0 && (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}
            >
              <Ionicons name="close" size={16} color={colors.danger} />
              <Text style={styles.clearFiltersText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more logs...</Text>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="document-text-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No logs found</Text>
      <Text style={styles.emptySubtitle}>
        {getActiveFilterCount() > 0 
          ? 'Try adjusting your filters to see more results'
          : 'No system logs are available at this time'
        }
      </Text>
      {getActiveFilterCount() > 0 && (
        <TouchableOpacity style={styles.clearFiltersEmptyButton} onPress={clearAllFilters}>
          <Text style={styles.clearFiltersEmptyButtonText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (currentUser?.type !== 'KNOWLEDGER') {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Message
          message={message}
          type={messageType}
          onDismiss={() => setMessage('')}
        />
      </View>
      
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      <Animated.View style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <View style={styles.headerBackground} />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.headerBackButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>System Logs</Text>
            <Text style={styles.headerSubtitle}>
              {filteredLogs.length} of {totalLogsCount} logs
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerStatusBadge}>
              <Ionicons name="document-text-outline" size={14} color="white" />
              <Text style={styles.headerStatusText}>Logs</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
            progressViewOffset={10}
          />
        }
      >
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}>
          {renderHeader()}
          
          {filteredLogs.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredLogs}
              renderItem={renderLogItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListFooterComponent={renderFooter}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
            />
          )}
        </Animated.View>
      </ScrollView>

      {/* Type Filter Modal */}
      <Modal visible={showTypeFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Log Type</Text>
            <ScrollView style={styles.modalScrollView}>
              {LOG_TYPE_OPTIONS.map((type) => {
                const isSelected = selectedLogTypes.includes(type.key);
                return (
                  <TouchableOpacity
                    key={type.key}
                    style={styles.modalOption(isSelected)}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedLogTypes(prev => prev.filter(t => t !== type.key));
                      } else {
                        setSelectedLogTypes(prev => [...prev, type.key]);
                      }
                    }}
                  >
                    <View style={[styles.modalOptionIcon, { backgroundColor: type.bgColor }]}>
                      <Ionicons name={type.icon} size={20} color={type.color} />
                    </View>
                    <Text style={styles.modalOptionText}>{type.name}</Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTypeFilter(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* User Filter Modal */}
      <Modal visible={showUserFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by User</Text>
            <ScrollView style={styles.modalScrollView}>
              {users.map((user) => {
                const isSelected = selectedUsers.includes(user.username);
                return (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.modalOption(isSelected)}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedUsers(prev => prev.filter(u => u !== user.username));
                      } else {
                        setSelectedUsers(prev => [...prev, user.username]);
                      }
                    }}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>
                        {user.username.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.modalOptionText}>{user.username}</Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowUserFilter(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Filter Modal */}
      <Modal visible={showDateFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filter by Date</Text>
            <ScrollView style={styles.modalScrollView}>
              {DATE_FILTER_OPTIONS.map((option) => {
                const isSelected = selectedDateFilter === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.modalOption(isSelected)}
                    onPress={() => setSelectedDateFilter(option.key)}
                  >
                    <Text style={styles.modalOptionText}>{option.name}</Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {selectedDateFilter === 'custom' && (
              <View style={styles.customDateContainer}>
                <Text style={styles.customDateLabel}>Custom Date Range</Text>
                <View style={styles.dateInputContainer}>
                  <InputField
                    placeholder="Start date (YYYY-MM-DD)"
                    value={customDateStart}
                    onChangeText={setCustomDateStart}
                  />
                  <InputField
                    placeholder="End date (YYYY-MM-DD)"
                    value={customDateEnd}
                    onChangeText={setCustomDateEnd}
                  />
                </View>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDateFilter(false)}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
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
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.medium,
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
    backgroundColor: colors.info,
    gap: 6,
  },
  headerStatusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 50,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.xlarge,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxlarge,
    minHeight: 200,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.medium,
  },
  headerContainer: {
    marginBottom: spacing.large,
  },
  filterContainer: {
    marginBottom: spacing.medium,
  },
  filterButton: (isActive) => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isActive ? colors.primary + '15' : colors.card,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    marginRight: spacing.small,
    borderWidth: 1,
    borderColor: isActive ? colors.primary : colors.border,
  }),
  filterButtonText: (isActive) => ({
    marginLeft: spacing.small,
    fontSize: 14,
    fontWeight: '500',
    color: isActive ? colors.primary : colors.textSecondary,
  }),
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '15',
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  clearFiltersText: {
    marginLeft: spacing.small,
    fontSize: 14,
    fontWeight: '500',
    color: colors.danger,
  },
  summaryContainer: {
    marginBottom: spacing.medium,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.large,
  },
  footerLoaderText: {
    marginLeft: spacing.small,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxlarge,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.medium,
    marginBottom: spacing.small,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.large,
  },
  clearFiltersEmptyButton: {
    marginTop: spacing.large,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
  },
  clearFiltersEmptyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    paddingTop: spacing.large,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.large,
    paddingHorizontal: spacing.large,
  },
  modalScrollView: {
    maxHeight: 400,
    paddingHorizontal: spacing.large,
  },
  modalOption: (isSelected) => ({
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.medium,
    marginBottom: spacing.small,
    backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
    borderRadius: borderRadius.medium,
  }),
  modalOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  customDateContainer: {
    paddingHorizontal: spacing.large,
    paddingTop: spacing.medium,
  },
  customDateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  dateInputContainer: {
    gap: spacing.medium,
  },
  modalCloseButton: {
    backgroundColor: colors.primary,
    margin: spacing.large,
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LogsScreen;

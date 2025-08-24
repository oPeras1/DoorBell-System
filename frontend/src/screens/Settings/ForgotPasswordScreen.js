import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Animated
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Message from '../../components/Message';
import PopUp from '../../components/PopUp';
import TextInputPopUp from '../../components/TextInputPopUp';
import { getPasswordResetRequests, approvePasswordResetRequest, rejectPasswordResetRequest } from '../../services/knowledgerService';
import { useColors } from '../../hooks/useColors';

const RequestCard = ({ request, onApprove, onReject }) => {
  const colors = useColors();
  const styles = getStyles(colors);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.requestCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.userIcon}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{request.username}</Text>
            <Text style={styles.requestDate}>Requested: {formatDate(request.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons name="time-outline" size={12} color={'#fff'} />
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => onReject(request)}
          activeOpacity={0.7}
        >
          <Ionicons name="close-outline" size={16} color={colors.danger} />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => onApprove(request.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark-outline" size={16} color="#FFF" />
          <Text style={styles.approveButtonText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ForgotPasswordScreen = ({ navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showRejectConfirmPopup, setShowRejectConfirmPopup] = useState(false);
  const [showRejectReasonPopup, setShowRejectReasonPopup] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovePopup, setShowApprovePopup] = useState(false);
  const [approveRequestId, setApproveRequestId] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const colors = useColors();
  const styles = getStyles(colors);

  const fetchRequests = async () => {
    try {
      const data = await getPasswordResetRequests();
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching password reset requests:', error);
      setErrorMessage('Failed to load password reset requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApproveRequest = (requestId) => {
    setApproveRequestId(requestId);
    setShowApprovePopup(true);
  };

  const confirmApproveRequest = async () => {
    if (!approveRequestId) return;
    try {
      await approvePasswordResetRequest(approveRequestId);
      setSuccessMessage('Password reset request approved successfully');
      setShowApprovePopup(false);
      setApproveRequestId(null);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      setErrorMessage('Failed to approve password reset request');
      setShowApprovePopup(false);
      setApproveRequestId(null);
    }
  };

  const cancelApproveRequest = () => {
    setShowApprovePopup(false);
    setApproveRequestId(null);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectConfirmPopup(true);
  };

  const confirmRejectStep1 = () => {
    setShowRejectConfirmPopup(false);
    setShowRejectReasonPopup(true);
  };

  const cancelRejectConfirm = () => {
    setShowRejectConfirmPopup(false);
    setSelectedRequest(null);
  };

  const confirmRejectStep2 = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      setErrorMessage('Please provide a reason for rejection');
      return;
    }

    try {
      await rejectPasswordResetRequest(selectedRequest.id, rejectionReason);
      setSuccessMessage('Password reset request rejected');
      setShowRejectReasonPopup(false);
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      setErrorMessage('Failed to reject password reset request');
    }
  };

  const cancelRejectReason = () => {
    setShowRejectReasonPopup(false);
    setSelectedRequest(null);
    setRejectionReason('');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  useEffect(() => {
    if (currentUser?.type !== 'KNOWLEDGER') {
      navigation.goBack();
      return;
    }
    fetchRequests();
    
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 50, useNativeDriver: false }),
    ]).start();
  }, []);

  if (currentUser?.type !== 'KNOWLEDGER') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.messageContainer}>
        <Message
          message={successMessage}
          onDismiss={() => setSuccessMessage('')}
          type="success"
        />
        <Message
          message={errorMessage}
          onDismiss={() => setErrorMessage('')}
          type="error"
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
            <Text style={styles.headerTitle}>Password Requests</Text>
            <Text style={styles.headerSubtitle}>
              {requests.length} {requests.length === 1 ? 'request' : 'requests'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.headerStatusBadge}>
              <Ionicons name="key-outline" size={14} color="white" />
              <Text style={styles.headerStatusText}>Requests</Text>
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
            onRefresh={onRefresh}
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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading requests...</Text>
            </View>
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="key-outline" size={64} color={colors.textSecondary} />
              </View>
              <Text style={styles.emptyTitle}>No Password Reset Requests</Text>
              <Text style={styles.emptySubtitle}>
                There are currently no pending password reset requests to review.
              </Text>
            </View>
          ) : (
            <View style={styles.requestsContainer}>
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                />
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <PopUp
        visible={showRejectConfirmPopup}
        title="Reject Password Reset Request"
        message={`Are you sure you want to reject the password reset request for "${selectedRequest?.username}"?`}
        confirmText="Continue"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmRejectStep1}
        onCancel={cancelRejectConfirm}
        showCancel={true}
      />

      <TextInputPopUp
        visible={showRejectReasonPopup}
        title="Rejection Reason"
        message="Please provide a reason for rejecting this password reset request:"
        placeholder="Enter rejection reason..."
        confirmText="Reject"
        cancelText="Cancel"
        type="danger"
        value={rejectionReason}
        onChangeText={setRejectionReason}
        onConfirm={confirmRejectStep2}
        onCancel={cancelRejectReason}
        multiline={true}
        numberOfLines={3}
      />

      <PopUp
        visible={showApprovePopup}
        title="Approve Password Reset Request"
        message={`Are you sure you want to approve the password reset request for "${requests.find(r => r.id === approveRequestId)?.username}"?`}
        confirmText="Approve"
        cancelText="Cancel"
        type="success"
        onConfirm={confirmApproveRequest}
        onCancel={cancelApproveRequest}
        showCancel={true}
      />
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
    backgroundColor: colors.warning,
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
    paddingTop: Platform.OS === 'android' ? 140 : 160,
    paddingHorizontal: spacing.large,
    paddingBottom: spacing.xlarge,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxlarge,
    minHeight: 200,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: spacing.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxlarge,
    paddingHorizontal: spacing.large,
    minHeight: 300,
    alignSelf: 'center',
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
  },
  requestsContainer: {
    gap: spacing.medium,
  },
  requestCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
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
    marginBottom: spacing.large,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  requestDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.small,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.warning,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.medium,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.medium,
    borderRadius: borderRadius.medium,
    gap: spacing.small,
  },
  rejectButton: {
    backgroundColor: `${colors.danger}10`,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  approveButton: {
    backgroundColor: colors.success,
  },
  rejectButtonText: {
    color: colors.danger,
    fontWeight: '600',
    fontSize: 14,
  },
  approveButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  popupInput: {
    marginTop: spacing.medium,
  },
  reasonInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    padding: spacing.medium,
    fontSize: 14,
    color: colors.textPrimary,
    minHeight: 80,
  },
});

export default ForgotPasswordScreen;

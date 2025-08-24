import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Message from '../../components/Message';
import { spacing } from '../../constants/styles';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import { requestPasswordReset, getPasswordResetStatus, resetPassword } from '../../services/auth';

const ForgotUserPassword = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetRequest, setResetRequest] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;

  const colors = useColors();
  const styles = getStyles(colors);

  const passwordValid = newPassword.length >= 6;
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  useEffect(() => {
    checkExistingRequest();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
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
    if (resetRequest?.status === 'APPROVED' && passwordValid && passwordsMatch) {
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: false,
      }).start();
    } else if (!resetRequest && username.length >= 4) {
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.spring(buttonScaleAnim, {
        toValue: 0.95,
        friction: 6,
        tension: 100,
        useNativeDriver: false,
      }).start();
    }
  }, [username, newPassword, confirmPassword, resetRequest, passwordValid, passwordsMatch]);

  const checkExistingRequest = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('passwordResetUsername');
      if (savedUsername) {
        setUsername(savedUsername);
        const status = await getPasswordResetStatus(savedUsername);
        setResetRequest(status);
      }
    } catch (error) {
      console.error('Error checking existing request:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!username || username.length < 4) {
      setErrors({ username: 'Username must be at least 4 characters' });
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      setErrors({});

      await requestPasswordReset(username);
      await AsyncStorage.setItem('passwordResetUsername', username);
      
      const status = await getPasswordResetStatus(username);
      setResetRequest(status);
      setSuccessMessage('Password reset request submitted successfully! Please wait for approval from a Knowledger.');
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to submit password reset request.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!passwordValid || !passwordsMatch) {
      const newErrors = {};
      if (!passwordValid) newErrors.newPassword = 'Password must be at least 6 characters';
      if (!passwordsMatch) newErrors.confirmPassword = 'Passwords do not match';
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      setSuccessMessage('');
      setErrors({});

      await resetPassword(username, newPassword);
      await AsyncStorage.removeItem('passwordResetUsername');
      
      setSuccessMessage('Password reset successfully! You can now sign in with your new password.');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 3000);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to reset password.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    await AsyncStorage.removeItem('passwordResetUsername');
    navigation.navigate('Login');
  };

  const refreshStatus = async () => {
    if (!username) return;
    
    try {
      setCheckingStatus(true);
      const status = await getPasswordResetStatus(username);
      setResetRequest(status);
    } catch (error) {
      console.error('Error refreshing status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const getStatusDisplay = () => {
    if (!resetRequest) return null;

    switch (resetRequest.status) {
      case 'PENDING':
        return (
          <View style={styles.statusCardCenter}>
            <View style={styles.statusCard}>
              <View style={styles.statusHeader}>
                <Ionicons name="time-outline" size={24} color={colors.warning} />
                <Text style={styles.statusTitle}>Request Pending</Text>
              </View>
              <Text style={styles.statusMessage}>
                Your password reset request is pending approval from a Knowledger. Please wait.
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={refreshStatus} disabled={checkingStatus}>
                {checkingStatus ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <>
                    <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                    <Text style={styles.refreshButtonText}>Refresh Status</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'APPROVED':
        return (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
              <Text style={styles.statusTitle}>Request Approved</Text>
            </View>
            <Text style={styles.statusMessage}>
              Your password reset request has been approved! You can now set a new password.
            </Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="close-circle-outline" size={24} color={colors.danger} />
              <Text style={styles.statusTitle}>Request Rejected</Text>
            </View>
            <Text style={styles.statusMessage}>
              Your password reset request has been rejected. 
              {resetRequest.rejectionReason ? ` Reason: ${resetRequest.rejectionReason}` : ' Please contact a Knowledger for more information.'}
            </Text>
            <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
              <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  if (checkingStatus) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Checking request status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle={colors.background === '#23283A' ? 'light-content' : 'dark-content'} />
      <Message message={errorMessage} onDismiss={() => setErrorMessage('')} type="error" />
      <Message message={successMessage} onDismiss={() => setSuccessMessage('')} type="success" />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Forgot Password</Text>
          </Animated.View>
          
          <Animated.Text style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginBottom: spacing.xxlarge,
            }
          ]}>
            Enter your username to request a password reset. A Knowledger will review your request and approve or reject it.
          </Animated.Text>
          
          <Animated.View style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            {!resetRequest && (
              <>
                <View style={styles.inputCenterContainer}>
                  <InputField
                    label="Username"
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={setUsername}
                    icon={<Ionicons name="person-outline" size={22} color={colors.primary} />}
                    error={errors.username}
                    autoCapitalize="none"
                  />
                </View>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Button 
                    title="Submit Request" 
                    onPress={handleSubmitRequest} 
                    loading={loading}
                    disabled={loading || username.length < 4}
                  />
                </Animated.View>
              </>
            )}

            {/* Center statusCard for PENDING */}
            {resetRequest?.status === 'PENDING' && (
              <View style={styles.statusCardCenter}>
                <View style={styles.statusCard}>
                  <View style={styles.statusHeader}>
                    <Ionicons name="time-outline" size={24} color={colors.warning} />
                    <Text style={styles.statusTitle}>Request Pending</Text>
                  </View>
                  <Text style={styles.statusMessage}>
                    Your password reset request is pending approval from a Knowledger. Please wait.
                  </Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={refreshStatus} disabled={checkingStatus}>
                    {checkingStatus ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <>
                        <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                        <Text style={styles.refreshButtonText}>Refresh Status</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Center statusCard for APPROVED */}
            {resetRequest?.status === 'APPROVED' && (
              <View style={styles.statusCardCenterApproved}>
                <View style={styles.statusCard}>
                  <View style={styles.statusHeader}>
                    <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                    <Text style={styles.statusTitle}>Request Approved</Text>
                  </View>
                  <Text style={styles.statusMessage}>
                    Your password reset request has been approved! You can now set a new password. Try to not forget it this time.
                  </Text>
                </View>
              </View>
            )}

            {/* Center statusCard for REJECTED */}
            {resetRequest?.status === 'REJECTED' && (
              <View style={styles.statusCardCenter}>
                <View style={styles.statusCard}>
                  <View style={styles.statusHeader}>
                    <Ionicons name="close-circle-outline" size={24} color={colors.danger} />
                    <Text style={styles.statusTitle}>Request Rejected</Text>
                  </View>
                  <Text style={styles.statusMessage}>
                    Your password reset request has been rejected. 
                    {resetRequest.rejectionReason ? ` Reason: ${resetRequest.rejectionReason}` : ' Please contact a Knowledger for more information.'}
                  </Text>
                  <TouchableOpacity style={styles.backButton} onPress={handleBackToLogin}>
                    <Text style={styles.backButtonText}>Back to Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Approved status inputs */}
            {resetRequest?.status === 'APPROVED' && (
              <>
                <InputField
                  label="New Password"
                  placeholder="Enter new password"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  icon={<Ionicons name="lock-closed-outline" size={22} color={colors.primary} />}
                  error={errors.newPassword}
                />
                
                <InputField
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  icon={<Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />}
                  error={errors.confirmPassword}
                />

                <View style={styles.requirementsBox}>
                  <Text style={styles.reqTitle}>Requirements</Text>
                  <View style={styles.reqItem}>
                    <Ionicons 
                      name={passwordValid ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={passwordValid ? colors.success : colors.danger} 
                    />
                    <Text style={[styles.reqText, { color: passwordValid ? colors.textPrimary : colors.textSecondary }]}>
                      Password with at least 6 characters
                    </Text>
                  </View>
                  <View style={styles.reqItem}>
                    <Ionicons 
                      name={passwordsMatch ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={passwordsMatch ? colors.success : colors.danger} 
                    />
                    <Text style={[styles.reqText, { color: passwordsMatch ? colors.textPrimary : colors.textSecondary }]}>
                      Passwords match
                    </Text>
                  </View>
                </View>

                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <Button 
                    title="Reset Password" 
                    onPress={handleResetPassword} 
                    loading={loading}
                    disabled={loading || !passwordValid || !passwordsMatch}
                  />
                </Animated.View>
              </>
            )}
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.medium,
    color: colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
    marginLeft: -spacing.small,
  },
  backButton: {
    padding: spacing.small,
    marginRight: spacing.small,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xlarge,
    paddingHorizontal: spacing.small,
    lineHeight: 24,
    color: colors.textSecondary,
  },
  formContainer: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
  },
  inputCenterContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
    minHeight: 60,
  },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.large,
    marginBottom: spacing.large,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusCardCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -60,
  },
  statusCardCenterApproved: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -20,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: spacing.small,
  },
  statusMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.medium,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.primary}10`,
    borderRadius: 8,
    paddingVertical: spacing.small,
    paddingHorizontal: spacing.medium,
    gap: spacing.small,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  requirementsBox: {
    borderRadius: 16,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    marginTop: spacing.medium,
    marginBottom: spacing.large,
    borderWidth: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  reqTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
    color: colors.textPrimary,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  reqText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginLeft: spacing.small,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.large,
    paddingBottom: spacing.large,
  },
  loginText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  loginLink: {
    fontWeight: 'bold',
    fontSize: 15,
    color: colors.primary,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ForgotUserPassword;

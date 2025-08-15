import React, { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  Animated
} from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Message from '../../components/Message';

const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;
  const timeoutRef = useRef(null);

  const usernameValid = username.length >= 4;
  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    // Enhanced entrance animation
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

  // Button scale animation when form is valid
  useEffect(() => {
    if (usernameValid && passwordValid && passwordsMatch) {
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
  }, [usernameValid, passwordValid, passwordsMatch]);

  const validateForm = () => {
    const newErrors = {};
    if (!usernameValid) newErrors.username = 'Username must be at least 4 characters';
    if (!passwordValid) newErrors.password = 'Password must be at least 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (!passwordsMatch) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      setLoading(true);
      await register({ username, password });
      setSuccessMessage('Account created successfully! You can now sign in.');
      // Salva o timeout para poder limpar depois
      timeoutRef.current = setTimeout(() => {
        setSuccessMessage('');
        navigation.navigate('Login');
      }, 10000);
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const dismissError = () => setErrorMessage('');
  const dismissSuccess = () => setSuccessMessage('');

  // Componente visual de requisitos
  const Requirement = ({ met, text }) => (
    <View style={styles.reqItem}>
      <Ionicons 
        name={met ? "checkmark-circle" : "close-circle"} 
        size={18} 
        color={met ? colors.success : colors.danger} 
        style={{ marginRight: 6 }}
      />
      <Text style={[styles.reqText, { color: met ? colors.success : colors.danger }]}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <Message message={errorMessage} onDismiss={dismissError} type="error" />
      <Message message={successMessage} onDismiss={dismissSuccess} type="success" />
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
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
          </Animated.View>
          <Animated.Text style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>Please fill out the form to create your account. Note that if you are not a member of the House, you may need to wait for approval to open the door.</Animated.Text>
          
          <Animated.View style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <InputField
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChangeText={setUsername}
              icon={<Ionicons name="person-outline" size={22} color={colors.primary} />}
              error={errors.username}
              autoCapitalize="none"
            />
            <InputField
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon={<Ionicons name="lock-closed-outline" size={22} color={colors.primary} />}
              error={errors.password}
            />
            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />}
              error={errors.confirmPassword}
            />

            {/* Requisitos visuais */}
            <Animated.View style={[
              styles.requirementsBox,
              {
                opacity: fadeAnim,
                transform: [{ 
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }]
              }
            ]}>
              <Requirement met={usernameValid} text="Username with at least 4 characters" />
              <Requirement met={passwordValid} text="Password with at least 6 characters" />
              <Requirement met={passwordsMatch} text="Passwords match" />
            </Animated.View>

            <Animated.View style={[
              styles.Register,
              {
                opacity: fadeAnim,
                transform: [{ scale: buttonScaleAnim }]
              }
            ]}>
              <Button 
                title="Sign Up" 
                onPress={handleRegister} 
                loading={loading}
                disabled={loading || !usernameValid || !passwordValid || !passwordsMatch }
              />
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
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
    padding: spacing.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
  },
  backButton: {
    padding: spacing.small,
    marginRight: spacing.small,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: spacing.xlarge,
    marginLeft: spacing.small + 40,
    marginTop: 0,
  },
  formContainer: {
    width: '100%',
    marginTop: spacing.large,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.large,
  },
  loginText: {
    color: colors.textSecondary,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  Register: {
    marginTop: spacing.large,
  },
  requirementsBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.medium,
    marginBottom: spacing.large,
    marginTop: spacing.small,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reqText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RegisterScreen;
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
import { spacing } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Message from '../../components/Message';
import { useColors } from '../../hooks/useColors';

const Requirement = ({ met, text, delay }) => {
    const themeColors = useColors();
    const scaleAnim = useRef(new Animated.Value(met ? 1 : 0)).current;
    const itemSlideAnim = useRef(new Animated.Value(20)).current;
    const itemFadeAnim = useRef(new Animated.Value(0)).current;
    const initialMount = useRef(true);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(itemFadeAnim, {
                toValue: 1,
                duration: 500,
                delay,
                useNativeDriver: false,
            }),
            Animated.spring(itemSlideAnim, {
                toValue: 0,
                friction: 7,
                tension: 40,
                delay,
                useNativeDriver: false,
            })
        ]).start();
    }, []);

    useEffect(() => {
        if (initialMount.current) {
            initialMount.current = false;
            return;
        }
        Animated.spring(scaleAnim, {
            toValue: met ? 1 : 0,
            friction: 4,
            useNativeDriver: false,
        }).start();
    }, [met]);

    const animatedIconStyle = {
        transform: [{ scale: scaleAnim }]
    };

    return (
        <Animated.View style={[
            styles.reqItem, 
            { opacity: itemFadeAnim, transform: [{ translateY: itemSlideAnim }] }
        ]}>
            <View style={styles.reqIconContainer}>
                <Ionicons 
                    name={"close-circle"} 
                    size={20} 
                    color={themeColors.danger} 
                    style={{ opacity: met ? 0 : 1 }}
                />
                <Animated.View style={[StyleSheet.absoluteFill, animatedIconStyle]}>
                    <Ionicons 
                        name={"checkmark-circle"} 
                        size={20} 
                        color={themeColors.success}
                    />
                </Animated.View>
            </View>
            <Text style={[styles.reqText, { color: met ? themeColors.textPrimary : themeColors.textSecondary }]}>{text}</Text>
        </Animated.View>
    );
};


const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;
  const timeoutRef = useRef(null);

  const usernameValid = username.length >= 4;
  const birthdateValidFormat = /^\d{2}-\d{2}-\d{4}$/.test(birthdate);
  const isOldEnough = (() => {
    if (!birthdateValidFormat) return false;
    const parts = birthdate.split('-');
    if (parts.length !== 3) return false;
    const [day, month, year] = parts.map(Number);

    const birthDateObj = new Date(year, month - 1, day);
    if (birthDateObj.getFullYear() !== year || birthDateObj.getMonth() !== month - 1 || birthDateObj.getDate() !== day) {
        return false;
    }

    const today = new Date();
    const sixteenYearsAgo = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    return birthDateObj <= sixteenYearsAgo;
  })();
  const passwordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
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
    if (usernameValid && birthdateValidFormat && isOldEnough && passwordValid && passwordsMatch) {
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
  }, [usernameValid, birthdateValidFormat, isOldEnough, passwordValid, passwordsMatch]);

  const validateForm = () => {
    const newErrors = {};
    if (!usernameValid) newErrors.username = 'Username must be at least 4 characters';
    if (!birthdate) newErrors.birthdate = 'Please enter your birthdate';
    else if (!birthdateValidFormat) newErrors.birthdate = 'Please use DD-MM-YYYY format';
    else if (!isOldEnough) newErrors.birthdate = 'You must be at least 16 years old';
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
      // Format date to YYYY-MM-DD for the backend
      const [day, month, year] = birthdate.split('-');
      const formattedBirthdate = `${year}-${month}-${day}`;
      await register({ username, password, birthdate: formattedBirthdate });
      setSuccessMessage('Account created successfully! You can now sign in.');
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

  const themeColors = useColors();

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44 }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle={themeColors.background === '#23283A' ? 'light-content' : 'dark-content'} />
      <Message message={errorMessage} onDismiss={dismissError} type="error" />
      <Message message={successMessage} onDismiss={dismissSuccess} type="success" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={[styles.scrollContainer, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
          <Animated.View style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={28} color={themeColors.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: themeColors.textPrimary }]}>Create Account</Text>
          </Animated.View>
          <Animated.Text style={[
            styles.subtitle,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              color: themeColors.textSecondary
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
              icon={<Ionicons name="person-outline" size={22} color={themeColors.primary} />}
              error={errors.username}
              autoCapitalize="none"
            />
            <InputField
              label="Birthdate"
              placeholder="DD-MM-YYYY"
              value={birthdate}
              onChangeText={setBirthdate}
              icon={<Ionicons name="calendar-outline" size={22} color={themeColors.primary} />}
              error={errors.birthdate}
              keyboardType="numeric"
              maxLength={10}
            />
            <InputField
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon={<Ionicons name="lock-closed-outline" size={22} color={themeColors.primary} />}
              error={errors.password}
            />
            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Ionicons name="shield-checkmark-outline" size={22} color={themeColors.primary} />}
              error={errors.confirmPassword}
            />

            {/* Requisitos visuais melhorados */}
            <Animated.View style={[
              styles.requirementsBox,
              {
                opacity: fadeAnim, // Fades in with the rest of the form
                backgroundColor: themeColors.card,
                borderColor: themeColors.border,
              }
            ]}>
              <Text style={[styles.reqTitle, { color: themeColors.textPrimary }]}>Requirements</Text>
              <Requirement met={usernameValid} text="Username with at least 4 characters" delay={100} />
              <Requirement met={birthdateValidFormat} text="Birthdate in DD-MM-YYYY format" delay={200} />
              <Requirement met={isOldEnough} text="You are at least 16 years old" delay={300} />
              <Requirement met={passwordValid} text="Password with at least 6 characters" delay={400} />
              <Requirement met={passwordsMatch} text="Passwords match" delay={500} />
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
                disabled={loading || !usernameValid || !birthdateValidFormat || !isOldEnough || !passwordValid || !passwordsMatch }
              />
              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { color: themeColors.textSecondary }]}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={[styles.loginLink, { color: themeColors.primary }]}>Sign In</Text>
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
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.small,
    marginLeft: -spacing.small, // Counteract button padding
  },
  backButton: {
    padding: spacing.small,
    marginRight: spacing.small,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xlarge,
    paddingHorizontal: spacing.small,
    lineHeight: 24,
  },
  formContainer: {
    width: '100%',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.large,
    paddingBottom: spacing.large,
  },
  loginText: {
    fontSize: 15,
  },
  loginLink: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  Register: {
    marginTop: spacing.large,
  },
  requirementsBox: {
    borderRadius: 16,
    paddingVertical: spacing.medium,
    paddingHorizontal: spacing.large,
    marginTop: spacing.large,
    borderWidth: 1,
  },
  reqTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.medium,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  reqIconContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
  },
  reqText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});

export default RegisterScreen;
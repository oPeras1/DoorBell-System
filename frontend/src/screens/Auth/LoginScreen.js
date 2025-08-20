import { useState, useContext, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  Animated
} from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Message from '../../components/Message';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../hooks/useColors';
import { useTheme } from '../../context/ThemeContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const buttonScaleAnim = useRef(new Animated.Value(0.95)).current;

  const colors = useColors();
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    // Enhanced entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: false,
      }),
      Animated.spring(logoScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  // Button scale animation when form is valid
  useEffect(() => {
    if (username.length >= 4 && password.length >= 6) {
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
  }, [username, password]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!username) newErrors.username = 'Username is required';
    if (!password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setErrorMessage('');
      await login({ username, password });
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('Register');
  };

  const dismissError = () => {
    setErrorMessage('');
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />
      {/* Theme toggle and beta chip*/}
      <View style={styles.themeRow}>
        <TouchableOpacity onPress={toggleTheme} style={styles.themeIcon}>
          <Ionicons
            name={isDarkMode ? "moon-outline" : "sunny-outline"}
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
        <View style={styles.betaChip}>
          <Text style={styles.betaText}>BETA</Text>
        </View>
      </View>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <Message
            message={errorMessage}
            onDismiss={dismissError}
            type="error"
          />
          <Animated.View style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: logoScaleAnim }
              ]
            }
          ]}>
            <Image 
              source={require('../../../assets/doorbell-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: colors.primary }]}>DoorBell Access</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome back! Please sign in to continue</Text>
          </Animated.View>
          
          <Animated.View style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>   
            <InputField
              label="Username"
              placeholder="Enter your username"
              value={username}
              onChangeText={setUsername}
              icon={<Ionicons name="person-outline" size={22} color={colors.primary} />}
              error={errors.username}
              autoCapitalize="none"
            />
            
            <InputField
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon={<Ionicons name="lock-closed-outline" size={22} color={colors.primary} />}
              error={errors.password}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
            </TouchableOpacity>

            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <Button 
                title="Sign In" 
                onPress={handleLogin} 
                loading={loading}
                disabled={loading || password.length < 6 || username.length < 4}
              />
            </Animated.View>
            
            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.large,
    justifyContent: 'center',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    position: 'absolute',
    top: 20,
    right: 30,
    zIndex: 10,
    gap: 8,
  },
  themeIcon: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  betaChip: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  betaText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xlarge,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.medium,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: spacing.small,
  },
  formContainer: {
    marginTop: spacing.large,
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xxlarge,
  },
  forgotPasswordText: {
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.medium,
  },
  registerLink: {
    fontWeight: '600',
  },
});

export default LoginScreen;
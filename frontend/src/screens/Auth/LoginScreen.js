import { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import Message from '../../components/Message';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState('');

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
    <View style={styles.root}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <Message 
        message={errorMessage} 
        onDismiss={dismissError}
        type="error"
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../../assets/doorbell-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>DoorBell Access</Text>
            <Text style={styles.subtitle}>Welcome back! Please sign in to continue</Text>
          </View>
          
          <View style={styles.formContainer}>   
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
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button 
              title="Sign In" 
              onPress={handleLogin} 
              loading={loading}
              disabled={loading || password.length < 6 || username.length < 4}
            />
            
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={navigateToRegister}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44, // 44 é comum no iOS notch
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.large,
    justifyContent: 'center',
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
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
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
    color: colors.primary,
    fontWeight: '500',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.medium,
  },
  registerText: {
    color: colors.textSecondary,
  },
  registerLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
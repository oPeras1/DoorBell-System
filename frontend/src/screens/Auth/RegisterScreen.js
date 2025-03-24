import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  SafeAreaView,
  Alert
} from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const RegisterScreen = ({ navigation }) => {
  const { register } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!username) newErrors.username = 'Username is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      await register({ username, email, password });
      
      // Navegar para login após registro bem-sucedido
      navigation.navigate('Login');
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
          </View>
          
          <Text style={styles.subtitle}>Fill in the form to create your account</Text>
          
          <View style={styles.formContainer}>
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
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              icon={<Ionicons name="mail-outline" size={22} color={colors.primary} />}
              error={errors.email}
              keyboardType="email-address"
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

            <Button 
              title="Sign Up" 
              onPress={handleRegister} 
              loading={loading}
              disabled={loading}
            />
            
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: spacing.medium,
    marginTop: Platform.OS === 'android' ? spacing.large : 0,
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
  },
  formContainer: {
    width: '100%',
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
  }
});

export default RegisterScreen;
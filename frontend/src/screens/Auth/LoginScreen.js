import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login({ email, password });
      // Após o login bem-sucedido, navegue para a Home
      navigation.navigate('Home');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DoorBell Access</Text>
      
      <InputField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
      />
      
      <InputField
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        icon="lock-closed-outline"
      />

      <Button title="Login" onPress={handleLogin} />

      <TouchableOpacity style={styles.forgotPassword}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.large,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 40,
  },
  forgotPassword: {
    marginTop: 20,
    alignSelf: 'center',
  },
  linkText: {
    color: colors.secondary,
    fontWeight: '500',
  }
});

export default LoginScreen;
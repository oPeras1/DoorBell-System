import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import { AuthContext } from '../context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    // Você pode adicionar uma tela de carregamento aqui se desejar
    return null;
  }

  return (
    <Stack.Navigator
      initialRouteName={userToken ? "Home" : "Login"}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' }
      }}
    >
      {userToken ? (
        <Stack.Screen name="Home" component={HomeScreen} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
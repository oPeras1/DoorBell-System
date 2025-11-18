import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { View, StyleSheet, StatusBar, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotUserPassword from '../screens/Auth/ForgotUserPassword';
import HomeScreen from '../screens/Home/HomeScreen';
import UsersScreen from '../screens/Users/UsersScreen';
import PartyScreen from '../screens/Party/PartyScreen';
import PartyCreateScreen from '../screens/Party/PartyCreateScreen';
import StatisticsScreen from '../screens/Statistics/StatisticsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import PartyDetailsScreen from '../screens/Party/PartyDetailsScreen';
import Notifications from '../screens/Notifications/Notifications';
import UsersDetailsScreen from '../screens/Users/UsersDetailsScreen';
import ForgotPasswordScreen from '../screens/Settings/ForgotPasswordScreen';
import LogsScreen from '../screens/Settings/LogsScreen';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';

const Stack = createStackNavigator();

// Get screen dimensions for responsive layout
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Improved detection for mobile web browsers
const isMobileWeb = isWeb && screenWidth < 768;
const isDesktopWeb = isWeb && screenWidth >= 768;

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.background },
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotUserPassword" component={ForgotUserPassword} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.background },
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="Users" component={UsersScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="Party" component={PartyScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="PartyCreate" component={PartyCreateScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="PartyDetails" component={PartyDetailsScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="Notifications" component={Notifications} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="UserDetails" component={UsersDetailsScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ unmountOnBlur: true }} />
    <Stack.Screen name="Logs" component={LogsScreen} options={{ unmountOnBlur: true }} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { userToken } = useContext(AuthContext);

  // For web, wrap in a container with proper responsive layout
  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <View style={[
          styles.webAppContainer,
          isMobileWeb && styles.webAppContainerMobile
        ]}>
          <StatusBar translucent={false} barStyle="light-content" />
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: colors.background }
            }}
          >
            {userToken ? (
              <Stack.Screen name="AppStack" component={AppStack} />
            ) : (
              <Stack.Screen name="AuthStack" component={AuthStack} />
            )}
          </Stack.Navigator>
        </View>
      </View>
    );
  }

  // For mobile platforms (Android/iOS)
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar 
        translucent={Platform.OS === 'android'} 
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} 
      />
      <View style={styles.container}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: colors.background }
          }}
        >
          {userToken ? (
            <Stack.Screen name="AppStack" component={AppStack} />
          ) : (
            <Stack.Screen name="AuthStack" component={AuthStack} />
          )}
        </Stack.Navigator>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  
  // Web-specific styles
  webContainer: {
    flex: 1,
    backgroundColor: colors.background,
    height: '100%',
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'auto',
    paddingBottom: 0,
  },
  webAppContainer: {
    flex: 1,
    maxWidth: isDesktopWeb ? Math.min(screenWidth, 480) : '100%',
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
    height: '100%',
    minHeight: '100vh',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    ...(isDesktopWeb && {
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
      borderRadius: 12,
      margin: 20,
      minHeight: 'calc(100vh - 40px)',
      maxHeight: 'calc(100vh - 40px)',
    }),
  },
  webAppContainerMobile: {
    margin: 0,
    maxWidth: '100%',
    width: '100%',
    borderRadius: 0,
    boxShadow: 'none',
    minHeight: '100vh',
    maxHeight: '100%',
    height: 'auto',
    paddingBottom: 55,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
});

export default AppNavigator;
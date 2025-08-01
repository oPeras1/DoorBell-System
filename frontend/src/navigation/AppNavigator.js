import React, { useContext } from 'react';
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet, StatusBar, Platform, Dimensions, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import UsersScreen from '../screens/Users/UsersScreen';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../constants/colors';

const Stack = createStackNavigator();

// Get screen dimensions for responsive layout
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

// Custom transition configuration with smooth animations
const transitionConfig = {
  gestureEnabled: true,
  gestureDirection: 'horizontal',
  transitionSpec: {
    open: {
      animation: 'timing',
      config: {
        duration: 400,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      },
    },
    close: {
      animation: 'timing',
      config: {
        duration: 350,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      },
    },
  },
  cardStyleInterpolator: ({ current, next, layouts }) => {
    return {
      cardStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.width, 0],
            }),
          },
          {
            scale: current.progress.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.92, 0.96, 1],
            }),
          },
        ],
        opacity: current.progress.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, 0.7, 1],
        }),
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.15],
        }),
      },
    };
  },
};

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.background },
      ...transitionConfig,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: colors.background },
      ...transitionConfig,
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Users" component={UsersScreen} />
  </Stack.Navigator>
);

const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={colors.primary} />
  </View>
);

const AppNavigator = () => {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={[styles.container, isWeb && styles.webContainer]}>
        <LoadingScreen />
      </View>
    );
  }

  // For web, wrap in a container with proper centering
  if (isWeb) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webAppContainer}>
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
    backgroundColor: colors.primary, // Status bar background color
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  // Web-specific styles
  webContainer: {
    flex: 1,
    backgroundColor: colors.background,
    minHeight: '100vh',
    width: '100vw',
    position: 'relative',
    overflow: 'hidden',
  },
  webAppContainer: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? Math.min(screenWidth, 480) : '100%',
    width: '100%',
    alignSelf: 'center',
    backgroundColor: colors.background,
    minHeight: '100vh',
    ...(Platform.OS === 'web' && {
      boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
      borderRadius: screenWidth > 768 ? 12 : 0,
      margin: screenWidth > 768 ? 20 : 0,
      minHeight: screenWidth > 768 ? 'calc(100vh - 40px)' : '100vh',
    }),
  },
});

export default AppNavigator;
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

const ONESIGNAL_APP_ID = Constants.expoConfig?.extra?.ONESIGNAL_APP_ID;

export default function App() {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    
    return () => subscription?.remove();
  }, []);
  
  useEffect(() => {
    if (Platform.OS !== 'web' && ONESIGNAL_APP_ID) {
      OneSignal.initialize(ONESIGNAL_APP_ID);
      OneSignal.Notifications.requestPermission(false);
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', e => e.getNotification().display());
    }
  }, []);
  
  return (
    <View style={[styles.appContainer, { height: dimensions.height }]}>
      <ThemeProvider>
        <AuthProvider>
            <NavigationContainer>
              <StatusBar 
                style={Platform.OS === 'web' ? 'auto' : 'light'} 
                translucent={Platform.OS === 'android'}
              />
              <AppNavigator />
            </NavigationContainer>
        </AuthProvider>
      </ThemeProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    ...(Platform.OS === 'web' ? {
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      position: 'relative',
      overflow: 'hidden'
    } : {})
  },
});

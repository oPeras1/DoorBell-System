import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
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
  const [isUpdating, setIsUpdating] = useState(false);

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
  
  // Check for updates
  useEffect(() => {
    async function checkForUpdates() {
      if (Platform.OS === 'web') return;
      
      try {
        setIsUpdating(true);
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        console.log('Error checking updates:', e);
      } finally {
        setIsUpdating(false);
      }
    }
    
    checkForUpdates();
  }, []);

  if (isUpdating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#b00" />
        <Text style={styles.loadingText}>Checking updates...</Text>
      </View>
    );
  }
  
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, StatusBar, TouchableOpacity, Text, Animated, ScrollView } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import TopField from '../../components/TopField';
import BottomNavBar from '../../components/BottomNavBar';
import { getMe } from '../../services/userService';
import { getParties } from '../../services/partyService';
import { getTimeBasedGreeting } from '../../constants/functions';

const HomeScreen = ({ navigation }) => {
  const { user: currentUser, logout, setUser } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [parties, setParties] = useState([]);
  const [isLoadingParties, setIsLoadingParties] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const fetchUserData = async () => {
    try {
      setIsLoadingUser(true);
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      // Check if it's a 404 error (user not authenticated)
      if (error.response && error.response.status === 404) {
        console.log('User not authenticated, redirecting to login...');
        // Force logout to clear any invalid tokens
        await logout();
        return;
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchParties = async () => {
    try {
      setIsLoadingParties(true);
      const partiesData = await getParties();
      setParties(partiesData || []);
    } catch (error) {
      setParties([]);
    } finally {
      setIsLoadingParties(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchParties();

    // Refresh parties every 30 seconds to catch status changes
    const interval = setInterval(fetchParties, 30000);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: false,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: false,
      }),
    ]).start();

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <TopField
        greeting={getTimeBasedGreeting()}
        userName={currentUser?.username}
        userType={currentUser?.type}
        isOnline={true}
        onProfilePress={() => {}}
        showDarkModeToggle={true}
        onLogout={logout}
      />

      <Animated.View style={[
        styles.contentContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        
        </ScrollView>
      </Animated.View>

      <BottomNavBar navigation={navigation} active="Home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? 80 : 95,
    paddingBottom: 100,
  },
});

export default HomeScreen;
import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, StatusBar, Animated } from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import TopField from '../../components/TopField';
import BottomNavBar from '../../components/BottomNavBar';
import { getMe } from '../../services/userService';
import { getTimeBasedGreeting } from '../../constants/functions';

const HomeScreen = ({ navigation }) => {
  const { user: currentUser, logout, setUser } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const fetchUserData = async () => {
    try {
      setIsLoadingUser(true);
      const userData = await getMe();
      setUser(userData);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('User not authenticated, redirecting to login...');
        await logout();
        return;
      }
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
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
        navigation={navigation}
      />

      <Animated.View style={[
        styles.contentContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}>
        <View style={styles.dashboardContainer}>
        </View>
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
  dashboardContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 80 : 95,
    paddingBottom: 100,
    paddingHorizontal: spacing.medium,
  },
});

export default HomeScreen;
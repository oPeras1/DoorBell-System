import React, { useState, useContext, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Animated,
  StatusBar
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TopField from '../../components/TopField';
import { getMe } from '../../services/userService';

const SettingsScreen = ({ navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return 'Good Morning';
    } else if (hour >= 12 && hour < 18) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getMe();
      } catch (error) {
        if (error.response && error.response.status === 404) {
          await logout();
        }
      }
    };
    checkAuth();

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
          <Text style={styles.pageTitle}>Settings</Text>
          <Text style={styles.pageSubtitle}>Configure your preferences</Text>
        </ScrollView>
      </Animated.View>
      
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Home')}
        >
          <Ionicons name="home-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Users')}
        >
          <Ionicons name="people-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Users</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Party')}
        >
          <Ionicons name="calendar-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.navText}>Party</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="settings" size={24} color={colors.primary} />
          <Text style={[styles.navText, { color: colors.primary }]}>Settings</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: spacing.large,
    paddingBottom: 100,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.small,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.medium,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...(Platform.OS === 'ios' ? {
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    } : {
      elevation: 8,
    }),
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  },
});

export default SettingsScreen;

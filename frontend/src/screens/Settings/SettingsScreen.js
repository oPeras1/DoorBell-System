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
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import TopField from '../../components/TopField';
import { getTimeBasedGreeting } from '../../constants/functions';
import BottomNavBar from '../../components/BottomNavBar';
import { useColors } from '../../hooks/useColors';

const SettingsScreen = ({ navigation }) => {
  const { user: currentUser, logout } = useContext(AuthContext);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const colors = useColors();

  useEffect(() => {
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

  const handlePersonalSettings = () => {
    if (currentUser?.id) {
      navigation.navigate('UserDetails', { userId: currentUser.id });
    }
  };

  return (
    <View style={styles.container(colors)}>
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
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.settingsSection}>
            <TouchableOpacity 
              style={styles.settingsItem(colors)}
              onPress={handlePersonalSettings}
              activeOpacity={0.7}
            >
              <View style={styles.settingsItemContent}>
                <View style={styles.settingsItemLeft}>
                  <View style={[styles.settingsIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="person-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.settingsTextContainer}>
                    <Text style={styles.settingsItemTitle(colors)}>Personal Account</Text>
                    <Text style={styles.settingsItemSubtitle(colors)}>Edit your profile and account details</Text>
                  </View>
                </View>
                <View style={styles.settingsItemRight}>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
      
      <BottomNavBar navigation={navigation} active="Settings" />
    </View>
  );
};

const styles = {
  container: (colors) => ({
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  }),
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
  settingsSection: {
    marginTop: spacing.medium,
  },
  settingsItem: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    marginBottom: spacing.medium,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  }),
  settingsItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.large,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.large,
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsItemTitle: (colors) => ({
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  }),
  settingsItemSubtitle: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
  }),
  settingsItemRight: {
    paddingLeft: spacing.medium,
  },
};

export default SettingsScreen;
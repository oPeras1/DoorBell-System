import React from 'react';
import { View, TouchableOpacity, Text, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../constants/styles';
import { useColors } from '../hooks/useColors';

const BottomNavBar = ({ navigation, active }) => {
  const colors = useColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Home')}
      >
        <Ionicons name="home" size={24} color={active === 'Home' ? colors.primary : colors.textSecondary} />
        <Text style={[styles.navText, active === 'Home' && { color: colors.primary }]}>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Users')}
      >
        <Ionicons name="people-outline" size={24} color={active === 'Users' ? colors.primary : colors.textSecondary} />
        <Text style={[styles.navText, active === 'Users' && { color: colors.primary }]}>Users</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Party')}
      >
        <Ionicons name="calendar-outline" size={24} color={active === 'Party' ? colors.primary : colors.textSecondary} />
        <Text style={[styles.navText, active === 'Party' && { color: colors.primary }]}>Party</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navItem}
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons name="settings-outline" size={24} color={active === 'Settings' ? colors.primary : colors.textSecondary} />
        <Text style={[styles.navText, active === 'Settings' && { color: colors.primary }]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colors) => StyleSheet.create({
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

export default BottomNavBar;

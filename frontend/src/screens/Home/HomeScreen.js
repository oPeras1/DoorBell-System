import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, borderRadius } from '../../constants/styles';
import { AuthContext } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';

const DUMMY_ACTIVITIES = [
  { id: 1, time: '10:30 AM', date: 'Today', action: 'Door Bell Ring', user: 'Guest' },
  { id: 2, time: '03:15 PM', date: 'Yesterday', action: 'Door Opened', user: 'John Doe' },
  { id: 3, time: '09:45 AM', date: 'Yesterday', action: 'Door Bell Ring', user: 'Delivery' },
  { id: 4, time: '06:20 PM', date: '22/03/2025', action: 'Door Bell Ring', user: 'Unknown' },
];

const HomeScreen = () => {
  const { logout, user } = useContext(AuthContext);
  const [isRinging, setIsRinging] = useState(false);

  const handleRingDoorbell = () => {
    setIsRinging(true);
    
    setTimeout(() => {
      setIsRinging(false);
    }, 3000);
  };

  const renderActivityItem = (item) => (
    <View key={item.id} style={styles.activityItem}>
      <View style={styles.activityIconContainer}>
        <Ionicons 
          name={item.action.includes('Ring') ? 'notifications' : 'lock-open'} 
          size={22} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityAction}>{item.action}</Text>
        <Text style={styles.activityUser}>{item.user}</Text>
      </View>
      <View style={styles.activityTime}>
        <Text style={styles.activityTimeText}>{item.time}</Text>
        <Text style={styles.activityDateText}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.username || 'User'}!</Text>
            <Text style={styles.status}>
              <View style={styles.statusDot} />
              System Online
            </Text>
          </View>
          
          <TouchableOpacity style={styles.profileButton}>
            <Image 
              source={require('../../../assets/avatar.png')} 
              style={styles.profileImage} 
            />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.doorStatusCard}>
            <View style={styles.doorStatusHeader}>
              <Text style={styles.doorStatusTitle}>Front Door Status</Text>
              <View style={styles.doorStatusBadge}>
                <Text style={styles.doorStatusBadgeText}>Secured</Text>
              </View>
            </View>
            
            <View style={styles.doorStatusBody}>
              <View style={styles.doorStatusItem}>
                <Ionicons name="lock-closed" size={22} color={colors.success} />
                <Text style={styles.doorStatusText}>Door Locked</Text>
              </View>
              <View style={styles.doorStatusItem}>
                <Ionicons name="thermometer" size={22} color={colors.info} />
                <Text style={styles.doorStatusText}>72°F</Text>
              </View>
              <View style={styles.doorStatusItem}>
                <Ionicons name="battery-full" size={22} color={colors.success} />
                <Text style={styles.doorStatusText}>96% Battery</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.doorbellContainer}>
            <Button 
              title={isRinging ? "Ringing..." : "Ring Doorbell"} 
              onPress={handleRingDoorbell}
              loading={isRinging}
              disabled={isRinging}
              iconLeft={!isRinging && <Ionicons name="notifications" size={22} color="white" />}
            />
          </View>
          
          <View style={styles.activityContainer}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.activityList}>
              {DUMMY_ACTIVITIES.map(renderActivityItem)}
            </View>
            
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All Activity</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={24} color={colors.primary} />
            <Text style={[styles.navText, { color: colors.primary }]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="people-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Users</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color={colors.textSecondary} />
            <Text style={styles.navText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 20 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
    paddingVertical: spacing.medium,
    marginTop: spacing.large,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  status: {
    fontSize: 16,
    color: colors.success,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
    marginRight: 6,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  scrollContent: {
    paddingHorizontal: spacing.large,
    paddingBottom: 90,
  },
  doorStatusCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.medium,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    marginVertical: spacing.medium,
  },
  doorStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.medium,
  },
  doorStatusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  doorStatusBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small / 2,
    borderRadius: 20,
  },
  doorStatusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  doorStatusBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  doorStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doorStatusText: {
    marginLeft: spacing.small,
    color: colors.textSecondary,
    fontSize: 14,
  },
  doorbellContainer: {
    marginVertical: spacing.large,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.medium,
  },
  activityContainer: {
    marginTop: spacing.medium,
  },
  activityList: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.medium,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  activityUser: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    alignItems: 'flex-end',
  },
  activityTimeText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  activityDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.medium,
    padding: spacing.medium,
  },
  viewAllText: {
    color: colors.primary,
    fontWeight: '600',
    marginRight: spacing.small,
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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  }
});

export default HomeScreen;
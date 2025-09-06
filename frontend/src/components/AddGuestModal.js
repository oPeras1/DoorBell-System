import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { spacing, borderRadius } from '../constants/styles';
import { getAllUsers } from '../services/userService';
import { USER_TYPE_INFO } from '../constants/users';
import InputField from './InputField';

const AddGuestModal = ({ visible, onClose, onAddGuest, existingGuestIds = [], hostId }) => {
  const colors = useColors();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    if (visible) {
      fetchUsers();
      setSelectedUsers([]);
      setSearchText('');
    }
  }, [visible]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      // Filter out existing guests and host
      const availableUsers = allUsers.filter(user => 
        !existingGuestIds.includes(user.id) && user.id !== hostId
      );
      setUsers(availableUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleUserToggle = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddSelected = () => {
    selectedUsers.forEach(user => {
      onAddGuest(user.id);
    });
    onClose();
  };

  const handleClearSearch = () => {
    setSearchText('');
  };

  const getAvatarSource = (userType) => {
    if (userType === 'KNOWLEDGER') {
      return require('../../assets/Avatar/avatarknowledger.jpg');
    }
    if (userType === 'HOUSER') {
      return require('../../assets/Avatar/avatarhouser.png');
    }
    return require('../../assets/Avatar/avatarguest.jpeg');
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.large,
    },
    container: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.large,
      width: '100%',
      maxWidth: 400,
      maxHeight: '80%',
      ...Platform.select({
        ios: {
          shadowColor: colors.cardShadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        },
        android: {
          elevation: 12,
        },
      }),
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.large,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.small,
    },
    searchContainer: {
      padding: spacing.large,
      paddingBottom: spacing.medium,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.large,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.medium,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: spacing.medium,
    },
    userItemSelected: {
      backgroundColor: `${colors.primary}10`,
      borderRadius: borderRadius.medium,
      paddingHorizontal: spacing.medium,
      borderBottomWidth: 0,
      marginBottom: spacing.small,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    userType: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    loadingContainer: {
      padding: spacing.xxLarge,
      alignItems: 'center',
    },
    emptyContainer: {
      padding: spacing.xxLarge,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.medium,
    },
    footer: {
      flexDirection: 'row',
      padding: spacing.large,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.medium,
    },
    cancelButton: {
      flex: 1,
      padding: spacing.medium,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontWeight: '600',
    },
    addButton: {
      flex: 1,
      padding: spacing.medium,
      borderRadius: borderRadius.medium,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    addButtonDisabled: {
      backgroundColor: colors.disabled,
    },
    addButtonText: {
      color: 'white',
      fontWeight: '600',
    },
    selectedCount: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.medium,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Guests</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <InputField
              placeholder="Search users..."
              value={searchText}
              onChangeText={setSearchText}
              icon={<Ionicons name="search" size={20} color={colors.textSecondary} />}
              showClearButton={true}
              onClear={handleClearSearch}
            />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {selectedUsers.length > 0 && (
              <Text style={styles.selectedCount}>
                {selectedUsers.length} user(s) selected
              </Text>
            )}
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : filteredUsers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="person-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyText}>
                  {searchText ? 'No users found matching your search' : 'No users available to add'}
                </Text>
              </View>
            ) : (
              filteredUsers.map((user) => {
                const isSelected = selectedUsers.find(u => u.id === user.id);
                const userTypeInfo = USER_TYPE_INFO[user.type] || USER_TYPE_INFO.GUEST;
                
                return (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.userItem, isSelected && styles.userItemSelected]}
                    onPress={() => handleUserToggle(user)}
                  >
                    <Image
                      source={getAvatarSource(user.type)}
                      style={styles.avatar}
                      resizeMode="cover"
                    />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.username}</Text>
                      <Text style={styles.userType}>{userTypeInfo.title}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.addButton, 
                selectedUsers.length === 0 && styles.addButtonDisabled
              ]} 
              onPress={handleAddSelected}
              disabled={selectedUsers.length === 0}
            >
              <Text style={styles.addButtonText}>
                Add {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AddGuestModal;

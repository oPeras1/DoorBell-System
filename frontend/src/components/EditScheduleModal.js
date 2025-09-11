// EditScheduleModal.js

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { spacing, borderRadius } from '../constants/styles';
import Calendar from './Calendar';

const EditScheduleModal = ({ visible, onClose, onSave, party }) => {
  const colors = useColors();
  const styles = getStyles(colors);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [editingDate, setEditingDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (party) {
      setStartDate(new Date(party.dateTime));
      setEndDate(new Date(party.endDateTime));
    }
  }, [party, visible]);

  const openCalendar = (type) => {
    setEditingDate(type);
    setIsCalendarVisible(true);
  };

  const handleDateSelect = (selectedDate) => {
    if (editingDate === 'start') {
      if (selectedDate >= endDate) {
        const newEndDate = new Date(selectedDate);
        newEndDate.setHours(newEndDate.getHours() + 1);
        setEndDate(newEndDate);
      }
      setStartDate(selectedDate);
    } else { // editing 'end'
      setEndDate(selectedDate);
    }
    setIsCalendarVisible(false);
    setEditingDate(null);
    setErrorMessage('');
  };

  const handleSave = async () => {
    if (endDate <= startDate) {
      setErrorMessage('The end date must be after the start date');
      return;
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const minMs = 20 * 60 * 1000; // 20 minutos
    const maxMs = 24 * 60 * 60 * 1000; // 24 horas

    if (diffMs < minMs) {
      setErrorMessage('The party must be at least 20 minutes long');
      return;
    }

    if (diffMs > maxMs) {
      setErrorMessage('The party cannot be longer than 24 hours');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      await onSave(startDate, endDate);
      onClose(); // Close the modal on success
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      setErrorMessage(backendMessage || 'Error saving changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Modal
        transparent
        animationType="fade"
        visible={visible} // ALTERAÇÃO: O modal principal agora permanece visível
        onRequestClose={onClose}
      >
        {/* O conteúdo não é mais ocultado, o Calendar irá sobrepô-lo */}
        <View style={styles.backdrop}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Edit Schedule</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="flag-outline" size={24} color={colors.primary} />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>START</Text>
                <Text style={styles.dateText}>{`${formatDate(startDate)} at ${formatTime(startDate)}`}</Text>
              </View>
              <TouchableOpacity style={styles.changeButton} onPress={() => openCalendar('start')}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
              <Ionicons name="checkmark-done-outline" size={24} color={colors.textSecondary} />
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>END</Text>
                <Text style={styles.dateText}>{`${formatDate(endDate)} at ${formatTime(endDate)}`}</Text>
              </View>
              <TouchableOpacity style={styles.changeButton} onPress={() => openCalendar('end')}>
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
            
            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <TouchableOpacity style={styles.confirmButton} onPress={handleSave} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* O Calendar é um modal e irá sobrepor o modal de edição */}
      {party && (
        <Calendar
          visible={isCalendarVisible}
          onClose={() => setIsCalendarVisible(false)}
          onDateSelect={handleDateSelect}
          selectedDate={editingDate === 'start' ? startDate : endDate}
          minimumDate={editingDate === 'end' ? startDate : new Date()}
          title={editingDate === 'start' ? 'Select starting date' : 'Select ending date'}
        />
      )}
    </>
  );
};

const getStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    gap: spacing.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.small / 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    gap: spacing.medium,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  changeButton: {
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    backgroundColor: `${colors.primary}20`,
    borderRadius: borderRadius.small,
  },
  changeButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.medium,
    alignItems: 'center',
    marginTop: spacing.medium,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.small,
  }
});

export default EditScheduleModal;
import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { spacing, borderRadius } from '../constants/styles';

const { width } = Dimensions.get('window');

const Calendar = ({ visible, onClose, onDateSelect, selectedDate, minimumDate, title }) => {
  const colors = useColors(); 
  const [date, setDate] = useState(selectedDate || new Date());
  const [displayMonth, setDisplayMonth] = useState(date.getMonth());
  const [displayYear, setDisplayYear] = useState(date.getFullYear());
  const intervalRef = useRef(null);

  // Get effective minimum date - if no minimumDate provided, don't enforce any minimum
  const getEffectiveMinimum = () => {
    if (!minimumDate) return null;
    const now = new Date();
    return minimumDate < now ? now : minimumDate;
  };

  useEffect(() => {
    if (visible && minimumDate) {
      const now = new Date();
      if (Math.abs(minimumDate.getTime() - now.getTime()) < 60000) {
        intervalRef.current = setInterval(() => {
          const currentTime = new Date();
          if (date < currentTime) {
            setDate(new Date(currentTime));
          }
        }, 60000);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [visible, minimumDate, date]);

  useEffect(() => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      const effectiveMinimum = getEffectiveMinimum();
      if (effectiveMinimum && newDate < effectiveMinimum) {
        setDate(new Date(effectiveMinimum));
        setDisplayMonth(effectiveMinimum.getMonth());
        setDisplayYear(effectiveMinimum.getFullYear());
      } else {
        setDate(newDate);
        setDisplayMonth(newDate.getMonth());
        setDisplayYear(newDate.getFullYear());
      }
    }
  }, [selectedDate, visible, minimumDate]);

  const changeMonth = (amount) => {
    const newDate = new Date(displayYear, displayMonth + amount, 1);
    setDisplayMonth(newDate.getMonth());
    setDisplayYear(newDate.getFullYear());
  };

  const handleDayPress = (day) => {
    const newDate = new Date(displayYear, displayMonth, day, date.getHours(), date.getMinutes());
    const effectiveMinimum = getEffectiveMinimum();

    if (effectiveMinimum) {
      const dayStart = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate());
      const minDayStart = new Date(effectiveMinimum.getFullYear(), effectiveMinimum.getMonth(), effectiveMinimum.getDate());
      if (dayStart < minDayStart) {
        return;
      }
      if (dayStart.getTime() === minDayStart.getTime()) {
        if (newDate < effectiveMinimum) {
          setDate(new Date(effectiveMinimum));
          return;
        }
      }
    }
    setDate(newDate);
  };

  const handleTimeChange = (unit, amount) => {
    const newDate = new Date(date);
    if (unit === 'hour') {
      newDate.setHours(date.getHours() + amount);
    } else {
      newDate.setMinutes(date.getMinutes() + amount);
    }
    const effectiveMinimum = getEffectiveMinimum();
    if (effectiveMinimum && newDate < effectiveMinimum) {
      setDate(new Date(effectiveMinimum));
      return;
    }
    setDate(newDate);
  };

  const handleConfirm = () => {
    onDateSelect(date);
    onClose();
  };

  const styles = StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.backdrop,
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      width: width * 0.9,
      maxWidth: 400,
      backgroundColor: colors.card,
      borderRadius: borderRadius.large,
      padding: spacing.large,
      shadowColor: colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    titleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.medium,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.small / 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.medium,
      marginBottom: spacing.medium,
    },
    monthText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    arrow: {
      padding: spacing.small,
    },
    daysOfWeekContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing.small,
      paddingBottom: spacing.small,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dayOfWeekText: {
      width: '14.28%',
      textAlign: 'center',
      color: colors.textSecondary,
      fontWeight: '500',
    },
    weekContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    dayContainer: {
      width: '14.28%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
    },
    dayText: {
      fontSize: 14,
      color: colors.textPrimary,
    },
    selectedDay: {
      backgroundColor: colors.primary,
    },
    selectedDayText: {
      color: colors.card,
      fontWeight: 'bold',
    },
    disabledDayText: {
      color: colors.disabled,
    },
    timePickerContainer: {
      marginTop: spacing.large,
      paddingTop: spacing.medium,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    timePickerLabel: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.medium,
    },
    timePickerControls: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    timeUnit: {
      alignItems: 'center',
    },
    timeButton: {
      padding: spacing.small,
    },
    timeButtonDisabled: {
      opacity: 0.3,
    },
    timeValue: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginHorizontal: spacing.medium,
    },
    timeSeparator: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.textPrimary,
      paddingBottom: 5,
    },
    confirmButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.medium,
      paddingVertical: spacing.medium,
      marginTop: spacing.large,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: colors.card,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.arrow}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.monthText}>
        {new Date(displayYear, displayMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
      </Text>
      <TouchableOpacity onPress={() => changeMonth(1)} style={styles.arrow}>
        <Ionicons name="chevron-forward" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderDaysOfWeek = () => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return (
      <View style={styles.daysOfWeekContainer}>
        {days.map((day, index) => (
          <Text key={index} style={styles.dayOfWeekText}>{day}</Text>
        ))}
      </View>
    );
  };

  const renderCalendarGrid = () => {
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayYear, displayMonth, 1).getDay();
    const effectiveMinimum = getEffectiveMinimum();
    const grid = [];
    let dayCounter = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < firstDayOfMonth) {
          week.push(<View key={`empty-${i}-${j}`} style={styles.dayContainer} />);
        } else if (dayCounter <= daysInMonth) {
          const day = dayCounter;
          const isSelected = date.getDate() === day && date.getMonth() === displayMonth && date.getFullYear() === displayYear;
          const currentDate = new Date(displayYear, displayMonth, day);
          const isDisabled = effectiveMinimum && currentDate < new Date(effectiveMinimum.getFullYear(), effectiveMinimum.getMonth(), effectiveMinimum.getDate());

          week.push(
            <TouchableOpacity
              key={day}
              style={[styles.dayContainer, isSelected && styles.selectedDay]}
              onPress={() => handleDayPress(day)}
              disabled={isDisabled}
            >
              <Text style={[
                styles.dayText,
                isSelected && styles.selectedDayText,
                isDisabled && styles.disabledDayText
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
          dayCounter++;
        } else {
          week.push(<View key={`empty-${i}-${j}`} style={styles.dayContainer} />);
        }
      }
      grid.push(<View key={`week-${i}`} style={styles.weekContainer}>{week}</View>);
      if (dayCounter > daysInMonth) break;
    }
    return grid;
  };

  const renderTimePicker = () => {
    const effectiveMinimum = getEffectiveMinimum();
    const isToday = effectiveMinimum &&
      date.getDate() === effectiveMinimum.getDate() &&
      date.getMonth() === effectiveMinimum.getMonth() &&
      date.getFullYear() === effectiveMinimum.getFullYear();

    const canDecreaseHour = !effectiveMinimum ||
      !isToday ||
      date.getHours() > effectiveMinimum.getHours();

    const canDecreaseMinute = !effectiveMinimum ||
      !isToday ||
      date.getHours() > effectiveMinimum.getHours() ||
      (date.getHours() === effectiveMinimum.getHours() && date.getMinutes() > effectiveMinimum.getMinutes());

    return (
      <View style={styles.timePickerContainer}>
        <Text style={styles.timePickerLabel}>Time</Text>
        <View style={styles.timePickerControls}>
          <View style={styles.timeUnit}>
            <TouchableOpacity onPress={() => handleTimeChange('hour', 1)} style={styles.timeButton}>
              <Ionicons name="chevron-up" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.timeValue}>{String(date.getHours()).padStart(2, '0')}</Text>
            <TouchableOpacity
              onPress={() => handleTimeChange('hour', -1)}
              style={[styles.timeButton, !canDecreaseHour && styles.timeButtonDisabled]}
              disabled={!canDecreaseHour}
            >
              <Ionicons
                name="chevron-down"
                size={24}
                color={canDecreaseHour ? colors.primary : colors.border}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.timeSeparator}>:</Text>
          <View style={styles.timeUnit}>
            <TouchableOpacity onPress={() => handleTimeChange('minute', 1)} style={styles.timeButton}>
              <Ionicons name="chevron-up" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.timeValue}>{String(date.getMinutes()).padStart(2, '0')}</Text>
            <TouchableOpacity
              onPress={() => handleTimeChange('minute', -1)}
              style={[styles.timeButton, !canDecreaseMinute && styles.timeButtonDisabled]}
              disabled={!canDecreaseMinute}
            >
              <Ionicons
                name="chevron-down"
                size={24}
                color={canDecreaseMinute ? colors.primary : colors.border}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.container} activeOpacity={1}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {renderHeader()}
          {renderDaysOfWeek()}
          {renderCalendarGrid()}
          {renderTimePicker()}
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default Calendar;
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';

const { width } = Dimensions.get('window');

const Calendar = ({ visible, onClose, onDateSelect, selectedDate, minimumDate, title }) => {
  const [date, setDate] = useState(selectedDate || new Date());
  const [displayMonth, setDisplayMonth] = useState(date.getMonth());
  const [displayYear, setDisplayYear] = useState(date.getFullYear());

  useEffect(() => {
    if (selectedDate) {
      setDate(new Date(selectedDate));
      setDisplayMonth(selectedDate.getMonth());
      setDisplayYear(selectedDate.getFullYear());
    }
  }, [selectedDate, visible]);

  const changeMonth = (amount) => {
    const newDate = new Date(displayYear, displayMonth + amount, 1);
    setDisplayMonth(newDate.getMonth());
    setDisplayYear(newDate.getFullYear());
  };

  const handleDayPress = (day) => {
    const newDate = new Date(displayYear, displayMonth, day, date.getHours(), date.getMinutes());
    if (minimumDate && newDate < new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate())) {
      return;
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

    if (minimumDate && newDate < minimumDate) {
        setDate(new Date(minimumDate));
        return;
    }
    setDate(newDate);
  };

  const handleConfirm = () => {
    onDateSelect(date);
    onClose();
  };

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
          const isDisabled = minimumDate && currentDate < new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate());

          week.push(
            <TouchableOpacity
              key={day}
              style={[styles.dayContainer, isSelected && styles.selectedDay]}
              onPress={() => handleDayPress(day)}
              disabled={isDisabled}
            >
              <Text style={[styles.dayText, isSelected && styles.selectedDayText, isDisabled && styles.disabledDayText]}>
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

  const renderTimePicker = () => (
    <View style={styles.timePickerContainer}>
      <Text style={styles.timePickerLabel}>Time</Text>
      <View style={styles.timePickerControls}>
        {/* Hour */}
        <View style={styles.timeUnit}>
          <TouchableOpacity onPress={() => handleTimeChange('hour', 1)} style={styles.timeButton}>
            <Ionicons name="chevron-up" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.timeValue}>{String(date.getHours()).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => handleTimeChange('hour', -1)} style={styles.timeButton}>
            <Ionicons name="chevron-down" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.timeSeparator}>:</Text>
        {/* Minute */}
        <View style={styles.timeUnit}>
          <TouchableOpacity onPress={() => handleTimeChange('minute', 5)} style={styles.timeButton}>
            <Ionicons name="chevron-up" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.timeValue}>{String(date.getMinutes()).padStart(2, '0')}</Text>
          <TouchableOpacity onPress={() => handleTimeChange('minute', -5)} style={styles.timeButton}>
            <Ionicons name="chevron-down" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: borderRadius.large,
    padding: spacing.large,
    shadowColor: '#000',
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
    color: colors.border,
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

export default Calendar;
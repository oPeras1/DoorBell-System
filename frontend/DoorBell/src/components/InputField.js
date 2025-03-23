import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/styles';

const InputField = ({ placeholder, value, onChangeText, secureTextEntry, icon }) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.medium,
  },
  input: {
    backgroundColor: 'white',
    padding: spacing.medium,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    fontSize: 16,
  }
});

export default InputField;
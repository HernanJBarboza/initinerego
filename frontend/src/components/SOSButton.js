import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, iconSizes } from '../utils/constants';

const SOSButton = ({ onPress, size = 70, style }) => {
  return (
    <TouchableOpacity
      style={[styles.container, { width: size, height: size }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="warning" size={size * 0.5} color={colors.white} />
      <Text style={styles.text}>SOS</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.danger,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: colors.white,
  },
  text: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: -4,
  },
});

export default SOSButton;

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';
import { colors, spacing, borderRadius, typography, vehicleTypes } from '../utils/constants';

const VehicleSelectionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [selectedVehicle, setSelectedVehicle] = useState(user?.vehicle_preference || null);
  const [loading, setLoading] = useState(false);

  const handleSelectVehicle = async (vehicleType) => {
    setSelectedVehicle(vehicleType);
  };

  const handleContinue = async () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Por favor selecciona un vehículo');
      return;
    }

    setLoading(true);
    try {
      // Save vehicle preference
      await usersAPI.updateVehiclePreference(selectedVehicle);
      navigation.navigate('SafetyCheck', { vehicleType: selectedVehicle });
    } catch (error) {
      console.error('Error saving preference:', error);
      // Continue anyway
      navigation.navigate('SafetyCheck', { vehicleType: selectedVehicle });
    } finally {
      setLoading(false);
    }
  };

  const vehicles = Object.values(vehicleTypes);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seleccionar Vehículo</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>
          ¿Qué vehículo usarás para este trayecto?
        </Text>

        {/* Vehicle Options */}
        <View style={styles.vehicleGrid}>
          {vehicles.map((vehicle) => {
            const isSelected = selectedVehicle === vehicle.id;
            return (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleCard,
                  isSelected && styles.vehicleCardSelected,
                ]}
                onPress={() => handleSelectVehicle(vehicle.id)}
              >
                <View style={[styles.vehicleIcon, { backgroundColor: vehicle.color + '20' }]}>
                  <Text style={styles.vehicleEmoji}>{vehicle.icon}</Text>
                </View>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                {isSelected && (
                  <View style={[styles.checkmark, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !selectedVehicle && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedVehicle || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? 'Guardando...' : 'Continuar'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.white} />
        </TouchableOpacity>

        {/* Info Text */}
        <Text style={styles.infoText}>
          Podrás cambiar tu vehículo en cualquier momento desde tu perfil.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.gray800,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  instruction: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  vehicleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  vehicleCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.gray200,
    position: 'relative',
  },
  vehicleCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  vehicleIcon: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vehicleEmoji: {
    fontSize: 40,
  },
  vehicleName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.gray800,
  },
  checkmark: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  infoText: {
    fontSize: typography.caption,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});

export default VehicleSelectionScreen;

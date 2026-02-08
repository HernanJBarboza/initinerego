import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { tripsAPI } from '../services/api';
import { getCurrentLocation } from '../services/location';
import { colors, spacing, borderRadius, typography, vehicleTypes } from '../utils/constants';

const TripStartScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const vehicleType = route.params?.vehicleType || 'car';
  const safetyCheckId = route.params?.safetyCheckId;

  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(true);

  useEffect(() => {
    fetchOriginLocation();
  }, []);

  const fetchOriginLocation = async () => {
    setGettingLocation(true);
    const result = await getCurrentLocation();
    if (result.success) {
      setOrigin(result.location);
    } else {
      Alert.alert(
        'Sin Ubicación',
        'No se pudo obtener tu ubicación actual. Puedes continuar, pero el origen no se registrara.'
      );
    }
    setGettingLocation(false);
  };

  const handleStartTrip = async () => {
    if (!destination.trim()) {
      Alert.alert('Error', 'Por favor ingresa un destino');
      return;
    }

    setLoading(true);
    try {
      const tripData = {
        vehicle_type: vehicleType,
        origin_latitude: origin?.latitude || 0,
        origin_longitude: origin?.longitude || 0,
        origin_address: 'Ubicacion actual',
        destination_latitude: 0,
        destination_longitude: 0,
        destination_address: destination,
        notes: notes || null,
      };

      const response = await tripsAPI.create(tripData);
      navigation.replace('ActiveTrip', { tripId: response.data.id });
    } catch (error) {
      console.error('Error creating trip:', error);
      Alert.alert('Error', 'No se pudo iniciar el viaje. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const vehicleInfo = vehicleTypes[vehicleType?.toUpperCase()];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Iniciar Viaje</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.vehicleInfoCard}>
          <View style={[styles.vehicleIcon, { backgroundColor: vehicleInfo.color + '20' }]}>
            <Text style={styles.vehicleEmoji}>{vehicleInfo.icon}</Text>
          </View>
          <Text style={styles.vehicleName}>{vehicleInfo.name}</Text>
          <Text style={styles.vehicleLabel}>Vehiculo seleccionado</Text>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={24} color={colors.success} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Origen</Text>
              <Text style={styles.locationValue}>
                {gettingLocation
                  ? 'Obteniendo ubicacion...'
                  : origin
                  ? `${origin.latitude?.toFixed(4)}, ${origin.longitude?.toFixed(4)}`
                  : 'No disponible'}
              </Text>
            </View>
          </View>
          <View style={styles.locationDivider}>
            <Ionicons name="arrow-down" size={16} color={colors.gray400} />
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="flag" size={24} color={colors.danger} />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Destino *</Text>
              <TextInput
                style={styles.destinationInput}
                value={destination}
                onChangeText={setDestination}
                placeholder="Ingresa tu destino"
                placeholderTextColor={colors.gray400}
              />
            </View>
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>Notas del viaje (opcional)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Agrega notas sobre tu trayecto..."
            placeholderTextColor={colors.gray400}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            El GPS comenzara a rastrear automaticamente cuando inicies el viaje.
            Puedes detener el seguimiento en cualquier momento.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.startButton, loading && styles.startButtonDisabled]}
          onPress={handleStartTrip}
          disabled={loading || gettingLocation}
        >
          <Ionicons name="navigate" size={28} color={colors.white} />
          <Text style={styles.startButtonText}>
            {loading
              ? 'Iniciando...'
              : gettingLocation
              ? 'Obteniendo ubicacion...'
              : 'Iniciar Viaje'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  vehicleInfoCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  vehicleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  vehicleEmoji: {
    fontSize: 40,
  },
  vehicleName: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.gray800,
  },
  vehicleLabel: {
    fontSize: typography.bodySmall,
    color: colors.gray600,
    marginTop: spacing.xs,
  },
  locationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  locationLabel: {
    fontSize: typography.caption,
    color: colors.gray600,
  },
  locationValue: {
    fontSize: typography.body,
    color: colors.gray800,
  },
  destinationInput: {
    fontSize: typography.body,
    color: colors.gray800,
    padding: 0,
    margin: 0,
  },
  locationDivider: {
    paddingLeft: 28,
    marginVertical: spacing.xs,
  },
  notesCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notesLabel: {
    fontSize: typography.bodySmall,
    fontWeight: '600',
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  notesInput: {
    fontSize: typography.body,
    color: colors.gray800,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight + '10',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.bodySmall,
    color: colors.gray700,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonDisabled: {
    opacity: 0.6,
  },
  startButtonText: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
});

export default TripStartScreen;

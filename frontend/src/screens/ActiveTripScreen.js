import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { tripsAPI } from '../services/api';
import { startLocationTracking, stopLocationTracking, getCurrentLocation } from '../services/location';
import { addToQueue } from '../services/offline';
import SOSButton from '../components/SOSButton';
import { colors, spacing, borderRadius, typography, vehicleTypes } from '../utils/constants';

const ActiveTripScreen = () => {
  const navigation = useNavigation();
  const [trip, setTrip] = useState(null);
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const intervalRef = useRef(null);
  const locationCallbackRef = useRef(null);

  const loadActiveTrip = async () => {
    try {
      const response = await tripsAPI.getActive();
      setTrip(response.data);
      setDistance(response.data.distance_km || 0);
      setDuration(response.data.duration_minutes || 0);
      
      if (response.data.started_at) {
        setStartTime(new Date(response.data.started_at));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        Alert.alert(
          'Sin Viaje Activo',
          'No tienes un viaje en curso. ¿Deseas iniciar uno?',
          [
            { text: 'Cancelar', onPress: () => navigation.navigate('Home') },
            { text: 'Iniciar Viaje', onPress: () => navigation.navigate('VehicleSelection') },
          ]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadActiveTrip();
      return () => {
        if (tracking) {
          stopTracking();
        }
      };
    }, [tracking])
  );

  useEffect(() => {
    if (trip && tracking) {
      // Start duration timer
      intervalRef.current = setInterval(() => {
        if (startTime) {
          const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000 / 60);
          setDuration(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [trip, tracking, startTime]);

  const handleLocationUpdate = useCallback(async (locationData) => {
    setLocation(locationData);
    setSpeed(locationData.speed ? locationData.speed * 3.6 : 0); // Convert m/s to km/h

    if (trip) {
      try {
        await tripsAPI.updateLocation(trip.id, locationData);
        setDistance((prev) => prev + (locationData.distance || 0));
      } catch (error) {
        // Queue for offline
        await addToQueue({
          type: 'TRIP_LOCATION_UPDATE',
          tripId: trip.id,
          data: locationData,
        });
      }
    }
  }, [trip]);

  const startTracking = async () => {
    const result = await startLocationTracking(handleLocationUpdate, {
      timeInterval: 10000,
      distanceInterval: 50,
    });

    if (result.success) {
      setTracking(true);
      locationCallbackRef.current = handleLocationUpdate;
    } else {
      Alert.alert('Error', 'No se pudo iniciar el seguimiento GPS');
    }
  };

  const stopTracking = async () => {
    await stopLocationTracking();
    setTracking(false);
  };

  const handleCompleteTrip = async () => {
    if (!tracking) {
      Alert.alert(
        'Finalizar Viaje',
        '¿Deseas finalizar este viaje?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Finalizar', 
            style: 'destructive',
            onPress: async () => {
              const result = await getCurrentLocation();
              const endLocation = result.success
                ? {
                    end_latitude: result.location.latitude,
                    end_longitude: result.location.longitude,
                  }
                : {
                    end_latitude: 0,
                    end_longitude: 0,
                  };

              try {
                await tripsAPI.complete(trip.id, endLocation);
                navigation.navigate('Home');
              } catch (error) {
                Alert.alert('Error', 'No se pudo finalizar el viaje');
              }
            }
          },
        ]
      );
    } else {
      Alert.alert(
        'Detener Seguimiento',
        '¿Deseas detener el seguimiento GPS y finalizar el viaje?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Finalizar',
            onPress: async () => {
              await stopTracking();
              // Then call handleCompleteTrip again (simplified)
              const result = await getCurrentLocation();
              try {
                await tripsAPI.complete(trip.id, {
                  end_latitude: result.location?.latitude || 0,
                  end_longitude: result.location?.longitude || 0,
                });
                navigation.navigate('Home');
              } catch (error) {
                Alert.alert('Error', 'No se pudo finalizar el viaje');
              }
            },
          },
        ]
      );
    }
  };

  const handleSOS = () => {
    if (tracking) {
      stopTracking();
    }
    navigation.navigate('Emergency', { tripId: trip?.id });
  };

  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const vehicleType = vehicleTypes[trip?.vehicle_type?.toUpperCase()];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando viaje...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.gray800} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Viaje en Curso</Text>
          <Text style={styles.headerSubtitle}>{vehicleType?.icon} {vehicleType?.name}</Text>
        </View>
        <TouchableOpacity style={styles.endButton} onPress={handleCompleteTrip}>
          <Text style={styles.endButtonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>

      {/* Map Area (Placeholder) */}
      <View style={styles.mapArea}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="location" size={48} color={colors.primary} />
          <Text style={styles.mapText}>Mapa en tiempo real</Text>
          {location && (
            <Text style={styles.locationText}>
              {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
            </Text>
          )}
        </View>

        {/* SOS Button */}
        <View style={styles.sosContainer}>
          <SOSButton onPress={handleSOS} size={80} />
        </View>
      </View>

      {/* Stats Panel */}
      <View style={styles.statsPanel}>
        {/* Duration */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.primaryLight + '20' }]}>
            <Ionicons name="time" size={24} color={colors.primary} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        </View>

        {/* Distance */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.successLight + '20' }]}>
            <Ionicons name="speedometer" size={24} color={colors.success} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
        </View>

        {/* Speed */}
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.warningLight + '20' }]}>
            <Ionicons name="flash" size={24} color={colors.warning} />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{speed.toFixed(1)} km/h</Text>
            <Text style={styles.statLabel}>Velocidad</Text>
          </View>
        </View>
      </View>

      {/* Tracking Status */}
      <View style={styles.trackingStatus}>
        <View style={[styles.statusIndicator, tracking && styles.statusIndicatorActive]} />
        <Text style={styles.statusText}>
          {tracking ? ' GPS activo - Rastreando ubicación' : ' GPS pausado'}
        </Text>
        {!tracking && (
          <TouchableOpacity style={styles.resumeButton} onPress={startTracking}>
            <Text style={styles.resumeButtonText}>Reanudar</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 10,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.gray800,
  },
  headerSubtitle: {
    fontSize: typography.bodySmall,
    color: colors.gray600,
  },
  endButton: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  endButtonText: {
    color: colors.white,
    fontSize: typography.bodySmall,
    fontWeight: '600',
  },
  mapArea: {
    flex: 1,
    backgroundColor: colors.gray100,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapText: {
    fontSize: typography.body,
    color: colors.gray600,
    marginTop: spacing.md,
  },
  locationText: {
    fontSize: typography.caption,
    color: colors.gray500,
    marginTop: spacing.xs,
  },
  sosContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
  },
  statsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statInfo: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: colors.gray800,
  },
  statLabel: {
    fontSize: typography.caption,
    color: colors.gray600,
  },
  trackingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xxl,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray300,
    marginRight: spacing.sm,
  },
  statusIndicatorActive: {
    backgroundColor: colors.success,
  },
  statusText: {
    fontSize: typography.bodySmall,
    color: colors.gray600,
    flex: 1,
  },
  resumeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  resumeButtonText: {
    color: colors.white,
    fontSize: typography.caption,
    fontWeight: '600',
  },
});

export default ActiveTripScreen;

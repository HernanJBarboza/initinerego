import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import SOSButton from '../components/SOSButton';
import { dashboardAPI, tripsAPI, safetyChecksAPI } from '../services/api';
import { colors, spacing, borderRadius, typography, vehicleTypes } from '../utils/constants';

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [stats, setStats] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [hasActiveTrip, setHasActiveTrip] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    try {
      const [dashboardRes, tripsRes] = await Promise.all([
        dashboardAPI.getStats(),
        tripsAPI.getAll({ limit: 5 }),
      ]);

      setStats(dashboardRes.data);
      setRecentTrips(tripsRes.data);
      setHasActiveTrip(dashboardRes.data.has_active_trip);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Don't logout automatically, just show error
      if (error.response?.status === 401) {
        // Token might be expired, but don't logout immediately
        // Let user stay on screen with error message
        setStats({
          stats: {
            total_trips: 0,
            completed_trips: 0,
            total_distance_km: 0,
            total_emergencies: 0
          }
        });
        setRecentTrips([]);
        setHasActiveTrip(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [])
  );

  const handleStartTrip = async () => {
    try {
      const safetyCheckRes = await safetyChecksAPI.getCurrent();
      const safetyCheck = safetyCheckRes.data;

      if (!safetyCheck || safetyCheck.status !== 'passed') {
        Alert.alert(
          'Check de Seguridad Requerido',
          'Debes completar el check de seguridad antes de iniciar un viaje.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Hacer Check', onPress: () => navigation.navigate('SafetyCheck') },
          ]
        );
        return;
      }

      navigation.navigate('VehicleSelection');
    } catch (error) {
      if (error.response?.status === 404) {
        Alert.alert(
          'Check de Seguridad Requerido',
          'Debes completar el check de seguridad antes de iniciar un viaje.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Hacer Check', onPress: () => navigation.navigate('SafetyCheck') },
          ]
        );
      }
    }
  };

  const handleContinueTrip = () => {
    navigation.navigate('ActiveTrip');
  };

  const getVehicleIcon = (vehicleType) => {
    const type = vehicleTypes[vehicleType?.toUpperCase()];
    return type?.icon || '🚗';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in_progress':
        return colors.primary;
      case 'emergency':
        return colors.danger;
      default:
        return colors.warning;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: colors.textSecondary }}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.userName}>{user?.full_name || 'Usuario'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
          <Ionicons name="person-circle" size={40} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Active Trip Banner */}
        {hasActiveTrip && (
          <TouchableOpacity style={styles.activeTripBanner} onPress={handleContinueTrip}>
            <Ionicons name="navigate" size={24} color={colors.white} />
            <View style={styles.activeTripText}>
              <Text style={styles.activeTripTitle}>Viaje en Curso</Text>
              <Text style={styles.activeTripSubtitle}>Toca para continuar rastreando</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.white} />
          </TouchableOpacity>
        )}

        {/* Start Trip Button */}
        <TouchableOpacity
          style={styles.startTripButton}
          onPress={handleStartTrip}
        >
          <Ionicons name="play-circle" size={48} color={colors.white} />
          <Text style={styles.startTripText}>
            {hasActiveTrip ? 'Continuar Viaje' : 'Iniciar Nuevo Viaje'}
          </Text>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats?.stats?.total_trips || 0}</Text>
            <Text style={styles.statLabel}>Total Viajes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {stats?.stats?.completed_trips || 0}
            </Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.primary }]}>
              {stats?.stats?.total_distance_km?.toFixed(1) || '0.0'} km
            </Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: colors.danger }]}>
              {stats?.stats?.total_emergencies || 0}
            </Text>
            <Text style={styles.statLabel}>Emergencias</Text>
          </View>
        </View>

        {/* Recent Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Viajes Recientes</Text>
          {recentTrips.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="car-sport-outline" size={48} color={colors.gray600} />
              <Text style={styles.emptyStateText}>No hay viajes recientes</Text>
              <TouchableOpacity onPress={handleStartTrip}>
                <Text style={styles.emptyStateAction}>Iniciar tu primer viaje</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => navigation.navigate('TripDetails', { tripId: trip.id })}
              >
                <View style={styles.tripIcon}>
                  <Text style={styles.tripIconText}>{getVehicleIcon(trip.vehicle_type)}</Text>
                </View>
                <View style={styles.tripInfo}>
                  <View style={styles.tripHeader}>
                    <Text style={styles.tripDate}>
                      {new Date(trip.started_at || trip.created_at).toLocaleDateString()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
                        {trip.status === 'in_progress' ? 'En curso' : 
                         trip.status === 'completed' ? 'Completado' : 
                         trip.status === 'emergency' ? 'Emergencia' : 'Pendiente'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.tripDistance}>{trip.distance_km?.toFixed(2) || '0.00'} km</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.gray500} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* SOS Button */}
      <View style={styles.sosContainer}>
        <SOSButton onPress={() => navigation.navigate('Emergency')} />
      </View>
    </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  greeting: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileButton: {
    padding: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  activeTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  activeTripText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  activeTripTitle: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
  },
  activeTripSubtitle: {
    color: colors.white + 'CC',
    fontSize: typography.caption,
  },
  startTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startTripText: {
    color: colors.white,
    fontSize: typography.h3,
    fontWeight: 'bold',
    marginLeft: spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  statValue: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  emptyStateText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyStateAction: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  tripIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tripIconText: {
    fontSize: 24,
  },
  tripInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tripDate: {
    fontSize: typography.bodySmall,
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontSize: typography.caption,
    fontWeight: '600',
  },
  tripDistance: {
    fontSize: typography.body,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  sosContainer: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.md,
  },
});

export default HomeScreen;

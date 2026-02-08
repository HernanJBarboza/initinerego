import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usersAPI } from '../services/api';
import { vehicleTypes } from '../utils/constants';
import { colors, spacing, borderRadius, typography } from '../utils/constants';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { themeName, toggleTheme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesion',
      'Deseas cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleChangeVehicle = () => {
    navigation.navigate('VehicleSelection');
  };

  const handleToggleTheme = () => {
    toggleTheme();
  };

  const vehiclePreference = user?.vehicle_preference
    ? vehicleTypes[user.vehicle_preference.toUpperCase()]
    : null;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={48} color={colors.primary} />
        </View>
        <Text style={styles.userName}>{user?.full_name || 'Usuario'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        {user?.phone && (
          <Text style={styles.userPhone}>{user.phone}</Text>
        )}
      </View>

      {/* Theme Toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.themeCard}>
          <View style={styles.themeInfo}>
            <Ionicons 
              name={isDark ? 'moon' : 'sunny'} 
              size={24} 
              color={colors.primary} 
            />
            <View style={styles.themeText}>
              <Text style={styles.themeName}>
                {isDark ? 'Modo Oscuro' : 'Modo Claro'}
              </Text>
              <Text style={styles.themeDescription}>
                {isDark ? 'Fondo oscuro para mayor contraste' : 'Fondo claro estilo clasico'}
              </Text>
            </View>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.gray300, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      {/* Vehicle Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vehiculo Preferido</Text>
        <TouchableOpacity style={styles.vehicleCard} onPress={handleChangeVehicle}>
          <View style={styles.vehicleIcon}>
            <Text style={styles.vehicleEmoji}>{vehiclePreference?.icon || '🚗'}</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {vehiclePreference?.name || 'Sin seleccionar'}
            </Text>
            <Text style={styles.vehicleChangeText}>Toca para cambiar</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray500} />
        </TouchableOpacity>
      </View>

      {/* Emergency Contact */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.gray500} />
            <Text style={styles.infoLabel}>Nombre:</Text>
            <Text style={styles.infoValue}>
              {user?.emergency_contact || 'No configurado'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={colors.gray500} />
            <Text style={styles.infoLabel}>Telefono:</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {user?.emergency_phone || 'No configurado'}
            </Text>
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acerca de la App</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.gray500} />
            <Text style={styles.infoLabel}>Version:</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="code-slash-outline" size={20} color={colors.gray500} />
            <Text style={styles.infoLabel}>Desarrollado por:</Text>
            <Text style={styles.infoValue}>HB TECH</Text>
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.danger }]}>Zona de Riesgo</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
          <Text style={styles.dangerButtonText}>Cerrar Sesion</Text>
        </TouchableOpacity>
      </View>

      {/* Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  userName: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  userPhone: {
    fontSize: typography.body,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  section: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeText: {
    marginLeft: spacing.md,
  },
  themeName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  themeDescription: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  vehicleEmoji: {
    fontSize: 28,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  vehicleChangeText: {
    fontSize: typography.caption,
    color: colors.primary,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    marginRight: spacing.xs,
  },
  infoValue: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  dangerButtonText: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.danger,
    marginLeft: spacing.sm,
  },
  bottomSpacing: {
    height: spacing.xxl,
  },
});

export default ProfileScreen;

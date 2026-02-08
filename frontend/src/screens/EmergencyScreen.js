import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { emergenciesAPI } from '../services/api';
import { getCurrentLocation } from '../services/location';
import { colors, spacing, borderRadius, typography, emergencyContacts } from '../utils/constants';

const EmergencyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const tripId = route.params?.tripId;

  const [location, setLocation] = useState(null);
  const [sending, setSending] = useState(false);
  const [emergencySent, setEmergencySent] = useState(false);

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    const result = await getCurrentLocation();
    if (result.success) {
      setLocation(result.location);
    }
  };

  const handleEmergency = async (type) => {
    if (!location) {
      Alert.alert(
        'Sin Ubicación',
        'No se pudo obtener tu ubicación. ¿Deseas enviar la emergencia sin ubicación?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Enviar', onPress: () => sendEmergency(type, null) },
        ]
      );
      return;
    }

    Alert.alert(
      'Confirmar Emergencia',
      `¿Estás seguro de que deseas reportar una emergencia de ${type.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => sendEmergency(type, location) },
      ]
    );
  };

  const sendEmergency = async (type, locationData) => {
    setSending(true);
    try {
      await emergenciesAPI.create({
        emergency_type: type.id,
        description: `Emergencia reportada: ${type.name}`,
        latitude: locationData?.latitude || 0,
        longitude: locationData?.longitude || 0,
        address: null,
      });

      setEmergencySent(true);

      Alert.alert(
        'Emergencia Enviada',
        'Tu emergencia ha sido reportada. Las autoridades han sido notificadas.',
        [
          { text: 'Volver al Inicio', onPress: () => navigation.navigate('Home') },
        ]
      );
    } catch (error) {
      console.error('Error sending emergency:', error);
      Alert.alert('Error', 'No se pudo enviar la emergencia. Llama directamente al número de emergencia.');
    } finally {
      setSending(false);
    }
  };

  const handleCall = (phone) => {
    // In a real app, use Linking to make phone calls
    Alert.alert(
      'Llamar Emergencias',
      `¿Deseas llamar al ${phone}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => console.log(`Calling ${phone}`) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.gray800} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergencia</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Emergency Alert */}
      <View style={styles.emergencyBanner}>
        <View style={styles.emergencyIcon}>
          <Ionicons name="warning" size={48} color={colors.white} />
        </View>
        <Text style={styles.emergencyTitle}>¿Necesitas ayuda?</Text>
        <Text style={styles.emergencySubtitle}>
          Selecciona el tipo de emergencia para solicitar asistencia inmediata
        </Text>
      </View>

      {/* Emergency Types */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Reportar Emergencia</Text>
        
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => handleEmergency({ id: 'accident', name: 'Accidente' })}
          disabled={sending}
        >
          <View style={[styles.emergencyIconSmall, { backgroundColor: colors.danger + '20' }]}>
            <Ionicons name="car-crash" size={32} color={colors.danger} />
          </View>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyName}>Accidente</Text>
            <Text style={styles.emergencyDescription}>Reportar un accidente de tránsito</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => handleEmergency({ id: 'robbery', name: 'Robo' })}
          disabled={sending}
        >
          <View style={[styles.emergencyIconSmall, { backgroundColor: colors.warning + '20' }]}>
            <Ionicons name="lock-closed" size={32} color={colors.warning} />
          </View>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyName}>Robo / Asalto</Text>
            <Text style={styles.emergencyDescription}>Reportar robo o asalto</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => handleEmergency({ id: 'medical', name: 'Médica' })}
          disabled={sending}
        >
          <View style={[styles.emergencyIconSmall, { backgroundColor: colors.primaryLight + '20' }]}>
            <Ionicons name="medical" size={32} color={colors.primary} />
          </View>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyName}>Emergencia Médica</Text>
            <Text style={styles.emergencyDescription}>Solicitar asistencia médica</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => handleEmergency({ id: 'other', name: 'Otro' })}
          disabled={sending}
        >
          <View style={[styles.emergencyIconSmall, { backgroundColor: colors.gray200 }]}>
            <Ionicons name="ellipsis-horizontal" size={32} color={colors.gray600} />
          </View>
          <View style={styles.emergencyInfo}>
            <Text style={styles.emergencyName}>Otro Tipo</Text>
            <Text style={styles.emergencyDescription}>Otro tipo de emergencia</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={colors.gray400} />
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.contactsSection}>
        <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
        <View style={styles.contactsGrid}>
          {emergencyContacts.map((contact) => (
            <TouchableOpacity
              key={contact.id}
              style={styles.contactCard}
              onPress={() => handleCall(contact.phone)}
            >
              <Text style={styles.contactIcon}>{contact.icon}</Text>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Location Status */}
      <View style={styles.locationStatus}>
        <Ionicons
          name={location ? "location" : "location-outline"}
          size={20}
          color={location ? colors.success : colors.gray400}
        />
        <Text style={[styles.locationText, !location && { color: colors.gray400 }]}>
          {location
            ? `Ubicación: ${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`
            : 'Obteniendo ubicación...'}
        </Text>
      </View>
    </SafeAreaView>
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
    paddingTop: spacing.xl + 10,
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
  emergencyBanner: {
    backgroundColor: colors.danger,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emergencyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emergencyTitle: {
    fontSize: typography.h2,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  emergencySubtitle: {
    fontSize: typography.body,
    color: colors.white + 'CC',
    textAlign: 'center',
  },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: '600',
    color: colors.gray800,
    marginBottom: spacing.md,
  },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emergencyIconSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  emergencyInfo: {
    flex: 1,
  },
  emergencyName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.gray800,
  },
  emergencyDescription: {
    fontSize: typography.caption,
    color: colors.gray600,
  },
  contactsSection: {
    padding: spacing.md,
  },
  contactsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactCard: {
    width: '32%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  contactName: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: colors.gray800,
    textAlign: 'center',
  },
  contactPhone: {
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: 'bold',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  locationText: {
    fontSize: typography.caption,
    color: colors.gray600,
    marginLeft: spacing.sm,
  },
});

export default EmergencyScreen;

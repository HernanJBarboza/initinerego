import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, borderRadius, typography } from '../utils/constants';

const RegisterScreen = ({ navigation }) => {
  const { register, loading, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setValidationError('');
    clearError();
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      return 'Por favor completa todos los campos obligatorios';
    }
    if (formData.password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Las contraseñas no coinciden';
    }
    return null;
  };

  const handleRegister = async () => {
    const validationError = validateForm();
    if (validationError) {
      setValidationError(validationError);
      return;
    }

    const result = await register({
      email: formData.email,
      password: formData.password,
      full_name: formData.fullName,
      phone: formData.phone || null,
      emergency_contact: formData.emergencyContact || null,
      emergency_phone: formData.emergencyPhone || null,
    });

    if (result.success) {
      // Navigate to main app on success
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para comenzar</Text>
          </View>

          {/* Error Messages */}
          {(error || validationError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || validationError}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            
            <Text style={styles.label}>Nombre Completo *</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              placeholder="Tu nombre completo"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="tu@email.com"
              placeholderTextColor={colors.gray400}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="Tu número de teléfono"
              placeholderTextColor={colors.gray400}
              keyboardType="phone-pad"
            />

            <Text style={styles.sectionTitle}>Seguridad</Text>

            <Text style={styles.label}>Contraseña *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(value) => updateField('password', value)}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor={colors.gray400}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Confirmar Contraseña *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              placeholder="Repite tu contraseña"
              placeholderTextColor={colors.gray400}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>

            <Text style={styles.label}>Nombre del contacto</Text>
            <TextInput
              style={styles.input}
              value={formData.emergencyContact}
              onChangeText={(value) => updateField('emergencyContact', value)}
              placeholder="Nombre del contacto"
              placeholderTextColor={colors.gray400}
            />

            <Text style={styles.label}>Teléfono de emergencia</Text>
            <TextInput
              style={styles.input}
              value={formData.emergencyPhone}
              onChangeText={(value) => updateField('emergencyPhone', value)}
              placeholder="Teléfono de emergencia"
              placeholderTextColor={colors.gray400}
              keyboardType="phone-pad"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h2 + 4,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.gray600,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.bodySmall,
  },
  form: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.gray700,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  label: {
    fontSize: typography.bodySmall,
    color: colors.gray600,
    marginBottom: spacing.xs,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.body,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerText: {
    fontSize: typography.body,
    color: colors.gray600,
  },
  footerLink: {
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;

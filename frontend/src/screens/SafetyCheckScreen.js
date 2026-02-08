import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { safetyChecksAPI } from '../services/api';
import { spacing, borderRadius, typography, safetyCheckItems } from '../utils/constants';

const SafetyCheckScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const vehicleType = route.params?.vehicleType || 'car';

  const [checkItems, setCheckItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkId, setCheckId] = useState(null);

  useEffect(() => {
    initializeSafetyCheck();
  }, []);

  const initializeSafetyCheck = async () => {
    try {
      const response = await safetyChecksAPI.create({});
      const items = response.data.items || [];
      setCheckItems(items);
      setCheckId(response.data.id);
    } catch (error) {
      console.error('Error creating safety check:', error);
      Alert.alert('Error', 'No se pudo crear el check de seguridad');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index) => {
    const newItems = [...checkItems];
    newItems[index].is_checked = !newItems[index].is_checked;
    setCheckItems(newItems);
  };

  const checkedCount = checkItems.filter((item) => item.is_checked).length;
  const progress = checkItems.length > 0 ? (checkedCount / checkItems.length) * 100 : 0;
  const allChecked = checkedCount === checkItems.length;

  const handleApprove = async () => {
    if (!allChecked) {
      Alert.alert(
        'Verificacion Incompleta',
        'Debes verificar todos los items de seguridad antes de continuar.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await safetyChecksAPI.updateItems(checkId, checkItems);
      await safetyChecksAPI.approve(checkId);
      
      Alert.alert(
        'Check de Seguridad Aprobado!',
        'Estas listo para iniciar tu viaje de manera segura.',
        [
          { text: 'Iniciar Viaje', onPress: () => navigation.navigate('TripStart', { vehicleType, safetyCheckId: checkId }) },
        ]
      );
    } catch (error) {
      console.error('Error approving safety check:', error);
      Alert.alert('Error', 'No se pudo aprobar el check de seguridad');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.textSecondary }}>Cargando check de seguridad...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Check de Seguridad</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={[styles.progressContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: colors.textPrimary }]}>Verificacion Pre-Viaje</Text>
          <Text style={[styles.progressCount, { color: colors.primary }]}>{checkedCount}/{checkItems.length}</Text>
        </View>
        <View style={[styles.progressBarBackground, { backgroundColor: colors.inputBorder }]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress}%` },
              allChecked && [styles.progressBarComplete, { backgroundColor: colors.success }],
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.warningBanner, { backgroundColor: colors.warningLight }]}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.textPrimary }]}>
            Es obligatorio completar todos los items de seguridad antes de iniciar cualquier viaje.
          </Text>
        </View>

        <View style={styles.itemsContainer}>
          {checkItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.checkItem,
                { backgroundColor: colors.surface, borderColor: item.is_checked ? colors.success : colors.inputBorder },
                item.is_checked && [styles.checkItemChecked, { backgroundColor: colors.successLight }],
              ]}
              onPress={() => toggleItem(index)}
            >
              <View style={styles.checkIcon}>
                {item.is_checked ? (
                  <Ionicons name="checkmark-circle" size={28} color={colors.success} />
                ) : (
                  <Ionicons name="ellipse-outline" size={28} color={colors.gray400} />
                )}
              </View>
              <View style={styles.checkInfo}>
                <Text style={[styles.checkName, { color: colors.textPrimary }]}>
                  {item.item_name?.replace(/_/g, ' ').toUpperCase() || item.name}
                </Text>
                <Text style={[styles.checkDescription, { color: colors.textSecondary }]}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.approveButton,
            { backgroundColor: allChecked ? colors.success : colors.gray500 },
            !allChecked && styles.approveButtonDisabled,
          ]}
          onPress={handleApprove}
          disabled={!allChecked || submitting}
        >
          <Ionicons name="shield-checkmark" size={24} color={colors.white} />
          <Text style={styles.approveButtonText}>
            {submitting
              ? 'Aprobando...'
              : allChecked
              ? 'Aprobar y Continuar'
              : `Verifica los ${checkItems.length} items`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + 20,
    paddingBottom: spacing.md,
    backgroundColor: 'transparent',
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: typography.body,
    fontWeight: '600',
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressBarComplete: {
    borderRadius: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.bodySmall,
  },
  itemsContainer: {
    marginBottom: spacing.lg,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  checkItemChecked: {
    borderColor: undefined,
  },
  checkIcon: {
    marginRight: spacing.md,
  },
  checkInfo: {
    flex: 1,
  },
  checkName: {
    fontSize: typography.body,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  checkDescription: {
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  approveButtonDisabled: {
    opacity: 0.5,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});

export default SafetyCheckScreen;

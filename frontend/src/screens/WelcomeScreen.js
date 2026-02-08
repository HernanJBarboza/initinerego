import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { colors, spacing, typography } from '../utils/constants';

const { height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { isAuthenticated, loading } = useAuth();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate based on auth state after animation
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // If authenticated, go to main app (Home via MainTabNavigator)
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        navigation.replace('Login');
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={styles.container}>
      {/* Background gradient effect */}
      <View style={styles.background}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>

      {/* Vehicle Pyramid */}
      <Animated.View 
        style={[
          styles.pyramidContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        {/* Top - Motorcycle */}
        <View style={styles.vehicleTop}>
          <Text style={styles.vehicleEmoji}>🏍️</Text>
        </View>

        {/* Middle - Car */}
        <View style={styles.vehicleMiddle}>
          <Text style={styles.vehicleEmoji}>🚗</Text>
        </View>

        {/* Bottom - Bus */}
        <View style={styles.vehicleBottom}>
          <Text style={styles.vehicleEmoji}>🚌</Text>
        </View>
      </Animated.View>

      {/* App Name */}
      <Animated.View 
        style={[
          styles.titleContainer,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}
      >
        <Text style={styles.appName}>InItinereGo</Text>
        <Text style={styles.tagline}>Seguimiento Seguro de Trayectos</Text>
      </Animated.View>

      {/* Loading indicator */}
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.primary + '30',
    top: -100,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primary + '20',
    bottom: -50,
    left: -50,
  },
  pyramidContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  vehicleTop: {
    marginBottom: spacing.sm,
  },
  vehicleMiddle: {
    marginBottom: spacing.sm,
  },
  vehicleBottom: {
    marginBottom: spacing.md,
  },
  vehicleEmoji: {
    fontSize: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  appName: {
    fontSize: typography.h1 + 8,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  tagline: {
    fontSize: typography.body,
    color: colors.white + 'CC',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: height * 0.1,
  },
  loadingText: {
    fontSize: typography.bodySmall,
    color: colors.white + '80',
  },
});

export default WelcomeScreen;

import * as Location from 'expo-location';
import { Platform } from 'react-native';

let locationSubscription = null;
let locationTask = null;

// Request permissions
export const requestLocationPermission = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      return { success: false, error: 'Permission to access location was denied' };
    }

    // For iOS 11+ and Android
    if (Platform.OS === 'ios') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        return { success: false, error: 'Background location permission denied' };
      }
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      const permission = await requestLocationPermission();
      if (!permission.success) {
        return { success: false, error: permission.error };
      }
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 15000,
      maximumAge: 10000,
    });

    return {
      success: true,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        speed: location.coords.speed,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Start continuous location tracking
export const startLocationTracking = async (callback, options = {}) => {
  try {
    const {
      accuracy = Location.Accuracy.High,
      timeInterval = 10000, // 10 seconds
      distanceInterval = 50, // 50 meters
      deferredUpdatesInterval = 10000,
    } = options;

    // Request permissions first
    const permission = await requestLocationPermission();
    if (!permission.success) {
      return { success: false, error: permission.error };
    }

    // Check if already tracking
    if (locationSubscription) {
      await stopLocationTracking();
    }

    // Subscribe to location updates
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy,
        timeInterval,
        distanceInterval,
        deferredUpdatesInterval,
      },
      (location) => {
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          timestamp: new Date().toISOString(),
        };
        callback(locationData);
      }
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Stop location tracking
export const stopLocationTracking = async () => {
  try {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get location services enabled status
export const isLocationServicesEnabled = async () => {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    return { success: true, enabled };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Format location for API
export const formatLocationForAPI = (location) => {
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    altitude: location.altitude || null,
    accuracy: location.accuracy || null,
    speed: location.speed || null,
  };
};

// Calculate distance between two points (km)
export const calculateDistance = (point1, point2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

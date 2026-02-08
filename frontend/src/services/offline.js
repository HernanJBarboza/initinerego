import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '../utils/constants';
import { tripsAPI } from './api';

// Queue for offline operations
let operationQueue = [];

// Initialize offline service
export const initializeOfflineService = async () => {
  try {
    // Load saved queue from storage
    const savedQueue = await AsyncStorage.getItem(storageKeys.OFFLINE_QUEUE);
    if (savedQueue) {
      operationQueue = JSON.parse(savedQueue);
    }
    
    // Check network status
    const isConnected = await checkNetworkStatus();
    
    return { success: true, isConnected, queueSize: operationQueue.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check network status (simplified - in production use NetInfo)
export const checkNetworkStatus = async () => {
  try {
    // Simple ping to API
    // In production, use @react-native-netinfo/react-native
    return true; // Assume connected for now
  } catch (error) {
    return false;
  }
};

// Add operation to queue
export const addToQueue = async (operation) => {
  try {
    const operationWithTimestamp = {
      ...operation,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    
    operationQueue.push(operationWithTimestamp);
    await saveQueue();
    
    return { success: true, queueSize: operationQueue.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Save queue to storage
const saveQueue = async () => {
  try {
    await AsyncStorage.setItem(storageKeys.OFFLINE_QUEUE, JSON.stringify(operationQueue));
  } catch (error) {
    console.error('Error saving queue:', error);
  }
};

// Process queue
export const processQueue = async () => {
  try {
    const isConnected = await checkNetworkStatus();
    
    if (!isConnected || operationQueue.length === 0) {
      return { success: true, processed: 0 };
    }
    
    const results = [];
    
    for (const operation of [...operationQueue]) {
      try {
        let result;
        
        switch (operation.type) {
          case 'TRIP_LOCATION_UPDATE':
            result = await tripsAPI.updateLocation(operation.tripId, operation.data);
            break;
          // Add more operation types as needed
          default:
            console.warn('Unknown operation type:', operation.type);
            continue;
        }
        
        if (result.status === 200) {
          // Remove from queue
          operationQueue = operationQueue.filter((op) => op.id !== operation.id);
          results.push({ success: true, id: operation.id });
        } else {
          // Increment retries
          operation.retries += 1;
          if (operation.retries >= 3) {
            // Remove after 3 retries
            operationQueue = operationQueue.filter((op) => op.id !== operation.id);
            results.push({ success: false, id: operation.id, error: 'Max retries exceeded' });
          }
        }
      } catch (error) {
        operation.retries += 1;
        if (operation.retries >= 3) {
          operationQueue = operationQueue.filter((op) => op.id !== operation.id);
          results.push({ success: false, id: operation.id, error: error.message });
        }
      }
    }
    
    await saveQueue();
    
    return { 
      success: true, 
      processed: results.length, 
      results 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get queue status
export const getQueueStatus = async () => {
  return {
    queueSize: operationQueue.length,
    operations: [...operationQueue],
  };
};

// Clear queue
export const clearQueue = async () => {
  try {
    operationQueue = [];
    await AsyncStorage.removeItem(storageKeys.OFFLINE_QUEUE);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sync function - call when coming back online
export const syncWhenOnline = async () => {
  const isConnected = await checkNetworkStatus();
  
  if (!isConnected) {
    return { success: false, error: 'No network connection' };
  }
  
  return await processQueue();
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { storageKeys } from '../utils/constants';

// Paletas de colores para cada tema
export const lightTheme = {
  colors: {
    // Primario (Marca) - Verde
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    primaryLight: '#81C784',
    
    // Fondo Claro
    background: '#F5F5F5',
    backgroundLight: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#EEEEEE',
    
    // Texto
    textPrimary: '#212121',
    textSecondary: '#757575',
    textDisabled: '#9E9E9E',
    
    // Estados semánticos
    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FFC107',
    warningLight: '#FFF8E1',
    danger: '#F44336',
    dangerLight: '#FFEBEE',
    
    // Elementos UI
    cardBackground: '#FFFFFF',
    cardBorder: '#E0E0E0',
    inputBackground: '#FFFFFF',
    inputBorder: '#BDBDBD',
    divider: '#E0E0E0',
    
    // Blanco y negro
    white: '#FFFFFF',
    black: '#000000',
    
    // Gris
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },
};

export const darkTheme = {
  colors: {
    // Primario (Marca) - Verde
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    primaryLight: '#81C784',
    
    // Fondo Oscuro
    background: '#121212',
    backgroundLight: '#1E1E1E',
    surface: '#000000',
    surfaceVariant: '#1E1E1E',
    
    // Texto
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textDisabled: '#666666',
    
    // Estados semánticos
    success: '#4CAF50',
    successLight: '#1B5E20',
    warning: '#FFC107',
    warningLight: '#FFA000',
    danger: '#F44336',
    dangerLight: '#D32F2F',
    
    // Elementos UI
    cardBackground: '#000000',
    cardBorder: '#333333',
    inputBackground: '#1E1E1E',
    inputBorder: '#333333',
    divider: '#333333',
    
    // Blanco y negro
    white: '#FFFFFF',
    black: '#000000',
    
    // Gris
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },
};

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState('dark'); // Por defecto dark
  const [theme, setTheme] = useState(darkTheme);
  const [loading, setLoading] = useState(true);

  // Cargar preferencia de tema al iniciar
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(storageKeys.THEME);
        if (savedTheme) {
          const themeValue = JSON.parse(savedTheme);
          setThemeName(themeValue);
          setTheme(themeValue === 'dark' ? darkTheme : lightTheme);
        } else {
          // Por defecto dark mode
          setTheme(darkTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        setTheme(darkTheme);
      } finally {
        setLoading(false);
      }
    };

    loadTheme();
  }, []);

  // Cambiar tema
  const toggleTheme = useCallback(async () => {
    const newThemeName = themeName === 'dark' ? 'light' : 'dark';
    setThemeName(newThemeName);
    setTheme(newThemeName === 'dark' ? darkTheme : lightTheme);
    
    // Guardar preferencia
    try {
      await AsyncStorage.setItem(storageKeys.THEME, JSON.stringify(newThemeName));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [themeName]);

  // Forzar un tema específico
  const setThemeMode = useCallback(async (mode) => {
    setThemeName(mode);
    setTheme(mode === 'dark' ? darkTheme : lightTheme);
    
    try {
      await AsyncStorage.setItem(storageKeys.THEME, JSON.stringify(mode));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const value = {
    themeName,
    theme,
    colors: theme.colors,
    isDark: themeName === 'dark',
    toggleTheme,
    setThemeMode,
    loading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Agregar clave de storage
storageKeys.THEME = '@theme';

// Funciones helper
export const getThemeColors = (isDark) => {
  return isDark ? darkTheme.colors : lightTheme.colors;
};

export default ThemeContext;

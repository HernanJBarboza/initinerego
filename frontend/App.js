import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import RootNavigator from './src/navigation/AppNavigator';
import { useTheme } from './src/context/ThemeContext';

const AppContent = () => {
  const { colors } = useTheme();

  return (
    <>
      <RootNavigator />
      <StatusBar style={colors.isDark ? "light" : "dark"} backgroundColor={colors.surface} />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// Paleta de Colores - Diseño Multiplataforma
export const colors = {
  // Primario (Marca) - Verde
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#81C784',
  
  // Fondo Oscuro (Dark Mode)
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
};

// Dimensiones
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Tamaños de texto - Tipografía Roboto/San Francisco
export const typography = {
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  small: 10,
};

// Bordes - Esquinas redondeadas
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Sombras - Minimalistas para dark mode
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// Tamaños de iconos
export const iconSizes = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
  xxlarge: 60,
};

// API Configuration
// Use Heroku URL directly for testing
export const API_BASE_URL = 'https://initinerego-api-2df8651fd39b.herokuapp.com/api/v1';

// Vehicle Types
export const vehicleTypes = {
  MOTORCYCLE: {
    id: 'motorcycle',
    name: 'Motocicleta',
    icon: '🏍️',
    color: '#4CAF50',
  },
  CAR: {
    id: 'car',
    name: 'Automóvil',
    icon: '🚗',
    color: '#4CAF50',
  },
  BUS: {
    id: 'bus',
    name: 'Autobús',
    icon: '🚌',
    color: '#4CAF50',
  },
};

// Safety Check Items
export const safetyCheckItems = [
  { id: 'vehicle_state', name: 'Estado del vehículo', description: 'Revision general del estado' },
  { id: 'lights', name: 'Luces', description: 'Faros, direccionales y luces de freno' },
  { id: 'brakes', name: 'Frenos', description: 'Frenos principales y de emergencia' },
  { id: 'tires', name: 'Neumaticos', description: 'Inflado y condicion de las ruedas' },
  { id: 'mirrors', name: 'Espejos', description: 'Espejos laterales y central' },
  { id: 'documents', name: 'Documentos', description: 'Licencia, seguro y documentacion' },
  { id: 'safety_gear', name: 'Equipo de seguridad', description: 'Casco/cinturon abrochado' },
  { id: 'first_aid', name: 'Kit de primeros auxilios', description: 'Botiquin presente y completo' },
];

// Emergency Contacts
export const emergencyContacts = [
  { id: 'police', name: 'Policia', phone: '123', icon: '👮' },
  { id: 'ambulance', name: 'Ambulancia', phone: '125', icon: '🚑' },
  { id: 'firefighters', name: 'Bomberos', phone: '119', icon: '🚒' },
];

// Trip Status
export const tripStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EMERGENCY: 'emergency',
  CANCELLED: 'cancelled',
};

// Storage Keys
export const storageKeys = {
  USER: '@user',
  TOKEN: '@token',
  VEHICLE_PREFERENCE: '@vehicle_preference',
  OFFLINE_QUEUE: '@offline_queue',
};

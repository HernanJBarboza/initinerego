# InItinereGo - Seguimiento Seguro de Trayectos Laborales

## 🚀 Descripción

InItinereGo es una aplicación móvil profesional para el seguimiento seguro de trayectos laborales con GPS, validación de seguridad pre-viaje y sistema de emergencias SOS.

## 📋 Características Principales

### 1. Sistema de Autenticación
- Registro de usuarios con email y contraseña
- Login con validación y encriptación bcrypt
- Persistencia de sesión con AsyncStorage
- Context API para gestión global de estado de autenticación

### 2. Selección de Vehículo Dinámico
- 3 modos de transporte: Motocicleta 🏍️, Automóvil 🚗, Autobús 🚌
- Interfaz visual con iconos grandes (60px para conducción)
- Cambio flexible de vehículo en cualquier momento
- Guardado de preferencia del usuario

### 3. Check de Seguridad Obligatorio (Hard Stop)
- 8 items de verificación pre-viaje:
  - Estado del vehículo
  - Luces funcionando
  - Frenos en buen estado
  - Neumáticos inflados
  - Espejos ajustados
  - Documentos al día
  - Casco/cinturón
  - Kit de primeros auxilios
- Barra de progreso visual
- **Validación crítica**: No se puede iniciar viaje sin completar todos los checks
- Navegación automática a inicio de viaje tras aprobación

### 4. Seguimiento GPS en Tiempo Real
- Rastreo de ubicación con expo-location
- Actualización automática cada 10 segundos o 50 metros
- Persistencia de ruta completa (array de coordenadas + timestamps)
- Permisos de ubicación configurados en iOS y Android
- Indicador visual de viaje activo

### 5. Sistema de Emergencia SOS
- Botón flotante global siempre visible en pantalla principal
- Pantalla de emergencia con alto contraste (rojo #FF453A)
- Captura automática de ubicación GPS actual
- Contactos de emergencia rápidos:
  - Policía (123)
  - Ambulancia (125)
  - Bombeiros (119)
- Registro de alertas en base de datos
- Actualización automática del estado del viaje a "emergency"

### 6. Dashboard de Usuario
- Estadísticas en tiempo real:
  - Total de viajes completados
  - Viajes activos
  - Total de alertas SOS
- Historial de viajes recientes
- Indicador de viaje en curso
- Diseño Apple/Google/Android triádico

### 7. Resiliencia Offline (Base)
- Persistencia local con AsyncStorage para sesión de usuario
- Base preparada para cola de sincronización diferida

## 🏗️ Arquitectura Técnica

### Backend (FastAPI + MongoDB)
- 6 módulos principales: Auth, Users, Vehicles, Safety Checks, Trips, Emergencies
- Validación de reglas de negocio:
  - Safety check obligatorio antes de trip
  - No duplicar viajes activos
  - Encriptación de contraseñas con bcrypt
- Documentación automática con Swagger/OpenAPI

### Frontend (Expo + React Native)
- Navegación por tabs (4 pantallas principales)
- Stack navigation para flujos de viaje
- 8 pantallas totales:
  1. Login/Register
  2. Home Dashboard
  3. Selección de Vehículo
  4. Check de Seguridad
  5. Inicio de Viaje
  6. Viaje Activo con GPS
  7. Emergencia SOS
  8. Perfil de Usuario
- Diseño mobile-first responsivo
- Targets táctiles de 44px+ (iOS guidelines)

### Base de Datos (MongoDB)
- 5 colecciones:
  - users (con vehicle_preference)
  - vehicles (moto/carro/bus)
  - safety_checks (items, passed status)
  - trips (route tracking, status)
  - emergencies (location, status)

## 📱 Diseño UX/UI

- **Sistema de diseño atómico** con tokens de color consistentes
- **Paleta profesional**:
  - Primario: #007AFF (iOS Blue)
  - Éxito: #34C759 (Verde)
  - Peligro: #FF453A (Rojo)
  - Advertencia: #FF9500 (Naranja)
- **Contraste alto** para conducción (ratio 7:1 en elementos críticos)
- **Iconografía consistente** con @expo/vector-icons (Ionicons)
- **Feedback visual** en todas las interacciones
- **Estados de carga** con ActivityIndicator

## 🔒 Seguridad y Permisos

**Configurado en app.json:**
- iOS: NSLocationWhenInUseUsageDescription, NSLocationAlwaysUsageDescription
- Android: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, FOREGROUND_SERVICE
- Encriptación bcrypt para contraseñas
- Validación de entrada en todos los formularios

## 🚀 Guía de Instalación

### Requisitos Previos
- Node.js 18+
- Python 3.11+
- MongoDB 6.0+
- Expo Go (para testing móvil)

### Backend Setup

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servidor
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar desarrollo
npm start

# Ejecutar en dispositivo específico
npm run android  # Android
npm run ios      # iOS
npm run web      # Web
```

## 📁 Estructura del Proyecto

```
INITINENREGO/
├── backend/
│   ├── app/
│   │   ├── config/
│   │   │   ├── database.py
│   │   │   └── settings.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── vehicles.py
│   │   │   ├── trips.py
│   │   │   ├── safety_checks.py
│   │   │   ├── emergencies.py
│   │   │   └── dashboard.py
│   │   ├── schemas/
│   │   │   └── pydantic_models.py
│   │   ├── utils/
│   │   │   └── auth_utils.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   ├── screens/
│   │   │   ├── LoginScreen.js
│   │   │   ├── RegisterScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── VehicleSelectionScreen.js
│   │   │   ├── SafetyCheckScreen.js
│   │   │   ├── TripStartScreen.js
│   │   │   ├── ActiveTripScreen.js
│   │   │   ├── EmergencyScreen.js
│   │   │   └── ProfileScreen.js
│   │   ├── components/
│   │   │   ├── LoadingScreen.js
│   │   │   └── SOSButton.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── location.js
│   │   │   └── offline.js
│   │   ├── navigation/
│   │   │   └── AppNavigator.js
│   │   └── utils/
│   │       └── constants.js
│   ├── App.js
│   ├── app.json
│   ├── babel.config.js
│   └── package.json
│
└── README.md
```

## 🎮 Cómo Usar la App

1. **Registrarse/Iniciar Sesión**
2. **Seleccionar tipo de vehículo** (moto/carro/bus)
3. **Completar Check de Seguridad** (obligatorio)
4. **Iniciar Viaje** → El GPS comienza a rastrear automáticamente
5. **Durante el viaje**:
   - Ver ubicación en tiempo real
   - Usar botón SOS si es necesario
6. **Finalizar Viaje** cuando llegues a destino

## 📈 Próximos Pasos Sugeridos

1. **Fase de Testing Móvil**: Probar en Expo Go con dispositivo real
2. **Geocercas (Geofencing)**: Definir zonas geográficas permitidas
3. **Modo Offline Completo**: Cola de sincronización diferida
4. **Dashboard RRHH**: Panel administrativo para supervisores
5. **Analytics**: Sentiment analysis de feedback de usuarios
6. **Encryption Avanzado**: AES-256 y K-anonimidad para datos sensibles

## 🛠️ Tecnologías

### Backend
- **FastAPI**: Framework web moderno y rápido
- **Motor**: Driver async para MongoDB
- **Pydantic**: Validación de datos
- **Python-Jose**: Manejo de tokens JWT
- **Passlib**: Encriptación de contraseñas
- **Uvicorn**: Servidor ASGI

### Frontend
- **React Native**: Framework de UI
- **Expo**: Herramientas y servicios
- **React Navigation**: Navegación
- **Axios**: Cliente HTTP
- **AsyncStorage**: Persistencia local
- **Expo Location**: API de ubicación

## 📄 Licencia

Este proyecto es parte de la iniciativa PHOENIX REPLICATOR de HB TECH.

---

**🎉 InItinereGo MVP está listo para uso!**

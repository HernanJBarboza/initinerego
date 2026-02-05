# 🚀 GUÍA DE DESPLIEGUE - InItinereGo

## Opción 1: Heroku (Backend API)

### Prerrequisitos
- Cuenta en [Heroku](https://heroku.com)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) instalado
- Git instalado

### Pasos para Deploy en Heroku

```bash
# 1. Inicializar git en el directorio backend
cd backend
git init
git add .
git commit -m "Initial commit - InItinereGo API"

# 2. Crear app en Heroku
heroku create initinerego-api

# 3. Agregar MongoDB (MongoDB Atlas o MongoLab)
heroku addons:create mongolab:sandbox

# 4. Configurar variables de entorno
heroku config:set SECRET_KEY="tu-clave-segura-muy-larga-aqui"
heroku config:set DEBUG=false
heroku config:set ACCESS_TOKEN_EXPIRE_MINUTES=1440

# 5. Desplegar
git push heroku main

# 6. Verificar el deploy
heroku open
```

### Verificar que funciona
```bash
# Endpoint de salud
heroku open /health

# Documentación API
heroku open /docs
```

---

## Opción 2: Railway (Backend + DB)

### Pasos
1. Ir a [Railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Seleccionar este repositorio
4. Agregar переменные окружения:
   - `SECRET_KEY`
   - `MONGODB_URL`
5. "Deploy"

---

## Opción 3: Render.com (Backend)

### Pasos
1. Ir a [Render.com](https://render.com)
2. "New Web Service"
3. Conectar GitHub
4. Configurar:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Agregar переменные окружения
6. "Create Web Service"

---

## Opción 4: Vercel/Netlify (Frontend Expo)

### Para Expo Web
```bash
cd frontend
npm install -g vercel
vercel --prod
```

### Configurar variables de entorno en Vercel
```
API_BASE_URL=https://tu-backend.herokuapp.com/api/v1
```

---

## 📱 Opción 5: Expo Go (Pruebas Locales)

```bash
# Instalar dependencias
cd frontend
npm install

# Iniciar servidor de desarrollo
npm start

# Escanear QR con app Expo Go
# Disponible en iOS App Store y Google Play Store
```

---

## 🔧 Configuración Post-Deploy

### 1. Actualizar Frontend
Edita `frontend/src/utils/constants.js`:
```javascript
export const API_BASE_URL = 'https://tu-app-heroku.herokuapp.com/api/v1';
```

### 2. Probar Endpoints
```bash
# Registro
curl -X POST https://tu-app.herokuapp.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@email.com","password":"password123","full_name":"Test User"}'

# Login
curl -X POST https://tu-app-herokuapp.com/api/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@email.com&password=password123"
```

---

## 🐛 Solución de Problemas

### Error: "Module not found"
```bash
# Asegúrate de estar en el directorio correcto
cd backend
pip install -r requirements.txt
```

### Error: "MongoDB connection"
- Verifica la variable `MONGODB_URL`
- Asegúrate de que MongoDB permita conexiones desde Heroku

### Error: "Port not found"
- Heroku usa `$PORT`, asegúrate de que el Procfile lo use

---

## 📞 Recursos Adicionales
- [Documentación FastAPI](https://fastapi.tiangolo.com)
- [Deploy en Heroku](https://devcenter.heroku.com/articles/deploying-python)
- [MongoDB Atlas](https://www.mongodb.com/atlas/database)

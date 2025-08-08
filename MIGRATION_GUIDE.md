# 🚀 Guía Completa de Migración: localStorage → PostgreSQL + Render

## Resumen de lo Completado

✅ **Análisis de datos locales** - Identificada estructura de localStorage  
✅ **Esquema PostgreSQL** - Diseñadas 8 tablas principales  
✅ **Backend Node.js/Express** - API completa con autenticación JWT  
✅ **Configuración pgAdmin** - Esquema y scripts listos  
✅ **Preparación Render** - Archivos de despliegue creados  
✅ **API DataService** - Servicio migrado para usar HTTP en lugar de localStorage  
✅ **Sistema de autenticación** - JWT tokens y sesiones seguras  

## 📋 Pasos Finales para Completar la Migración

### Paso 1: Configurar PostgreSQL Local

```bash
# En pgAdmin 4:
1. Crear base de datos 'playtest_db'
2. Ejecutar el script database-schema.sql
3. Verificar que todas las tablas se crearon correctamente
```

### Paso 2: Probar Backend Localmente

```bash
cd playtest-backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Editar .env con tu configuración local:
DATABASE_URL=postgresql://tu_usuario:tu_password@localhost:5432/playtest_db
JWT_SECRET=tu_secreto_super_seguro_aqui
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Ejecutar migración
npm run migrate

# Iniciar servidor
npm run dev
```

### Paso 3: Desplegar en Render

```bash
# En el directorio playtest-backend:
git init
git add .
git commit -m "Initial backend setup"

# Subir a GitHub/GitLab
git remote add origin https://github.com/tu-usuario/playtest-backend.git
git push -u origin main

# En Render.com:
1. Conectar repositorio
2. Usar render.yaml para configuración automática
3. Esperar despliegue
4. Anotar URL de producción
```

### Paso 4: Actualizar Frontend

#### 4.1 Incluir API DataService en todos los archivos HTML

En cada archivo HTML (game-trivial.html, index.html, etc.), añadir antes del script principal:

```html
<!-- API Data Service -->
<script src="api-data-service.js"></script>
```

#### 4.2 Reemplazar dataService en cada archivo

**ANTES (localStorage):**
```javascript
const dataService = {
    fetchAllBlocks: async () => simulateDelay((getDatabase().globalBlocks || [])...),
    // ...
};
```

**DESPUÉS (API):**
```javascript
const dataService = {
    fetchAllBlocks: () => apiDataService.fetchAllBlocks(),
    fetchGame: (gameId) => apiDataService.fetchGame(gameId),
    updateGame: (gameId, data) => apiDataService.updateGame(gameId, data),
    // ... todas las funciones usando apiDataService
};
```

#### 4.3 Actualizar URL de API en api-data-service.js

```javascript
// Cambiar la URL de producción:
const getAPIBaseURL = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:3000/api';
  }
  return 'https://TU-APP-RENDER.onrender.com/api'; // 👈 Tu URL real
};
```

### Paso 5: Migrar Datos Existentes (Opcional)

Si tienes datos importantes en localStorage, crear script de migración:

```javascript
// migration-script.js
async function migrateLocalStorageData() {
  const localDb = JSON.parse(localStorage.getItem('playtest_db_v3') || '{}');
  
  // Migrar usuarios
  for (const user of localDb.users || []) {
    await apiDataService.register(user.nickname, 'default_password', user.email);
  }
  
  // Migrar bloques
  for (const block of localDb.globalBlocks || []) {
    await apiDataService.createBlock({
      name: block.name,
      description: block.description
    });
  }
  
  // Migrar preguntas...
  // etc.
}
```

### Paso 6: Actualizar Autenticación

#### 6.1 Modificar login en index.html

**ANTES:**
```javascript
const loginUser = async (nickname, password) => {
  const user = db.users.find(u => u.nickname === nickname && u.password === password);
  // ...
};
```

**DESPUÉS:**
```javascript
const loginUser = async (nickname, password) => {
  try {
    const response = await apiDataService.login(nickname, password);
    // El token se guarda automáticamente
    window.location.href = 'all-blocks.html';
  } catch (error) {
    console.error('Login failed:', error);
    alert('Error de login: ' + error.message);
  }
};
```

#### 6.2 Actualizar UserProvider en archivos de juego

```javascript
const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiDataService.apiCall('/auth/verify');
        setCurrentUser(response.user);
      } catch (error) {
        window.location.href = 'index.html';
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);
  
  // ... resto igual
};
```

## 🔧 Solución de Problemas Comunes

### Error: "CORS not allowed"
- Verificar FRONTEND_URL en variables de entorno
- Asegurar que coincide con tu URL de desarrollo

### Error: "JWT token expired"
- Los tokens duran 7 días
- Implementar refresh automático o re-login

### Error: "Database connection failed"
- Verificar DATABASE_URL en .env
- Comprobar conexión PostgreSQL

### Error: "User not authorized"
- Verificar que el token se está enviando
- Comprobar que el usuario existe en la BD

## 📱 Testing de la Migración

### 1. Pruebas Locales
```bash
# Terminal 1: Backend
cd playtest-backend && npm run dev

# Terminal 2: Frontend  
cd .. && npm run dev

# Probar:
- Login/registro
- Crear bloques
- Añadir preguntas
- Jugar partidas
- Verificar persistencia
```

### 2. Pruebas de Producción
- Registrar usuarios nuevos
- Crear contenido
- Verificar que datos persisten entre sesiones
- Probar desde diferentes dispositivos

## 🎯 Beneficios de la Migración

✅ **Persistencia real** - Los datos sobreviven a limpiezas del navegador  
✅ **Multi-dispositivo** - Acceso desde cualquier lugar  
✅ **Colaboración** - Múltiples usuarios reales  
✅ **Escalabilidad** - Soporta más usuarios y datos  
✅ **Backup automático** - Los datos están seguros en la nube  
✅ **Sincronización** - Cambios en tiempo real entre dispositivos  

## 🔄 Rollback Plan (Si algo falla)

1. Mantener archivos originales como backup
2. Cambiar import en HTML: `<!-- <script src="api-data-service.js"></script> -->`
3. Restaurar dataService original
4. Los datos localStorage siguen ahí

¡La migración está lista! 🚀
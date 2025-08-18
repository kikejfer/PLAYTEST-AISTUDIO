# 🚀 GUÍA DE DESPLIEGUE FINAL - PROYECTO PLAYTEST

## 📋 Estado Actual del Proyecto

### ✅ **Funcionalidades Implementadas Completamente**

1. **🏆 Sistema de Niveles Completo**
   - 3 tipos de niveles (Usuario, Creador, Profesor)
   - 15 niveles diferentes con cálculo automático
   - Sistema de badges con rareza
   - Pagos semanales automáticos en Luminarias
   - Paneles web de visualización

2. **💰 Sistema de Luminarias Unificado**
   - Transacciones completas con trazabilidad
   - Sistema de retiro y conversión a dinero real
   - Marketplace interno
   - Tienda de beneficios
   - Análisis financiero avanzado

3. **🎯 Sistema de Challenges Avanzado**
   - 4 tipos de challenges (Marathon, Streak, Consolidation, Competition)
   - Sistema A/B testing
   - Integración completa con niveles
   - Analytics y reporting

4. **🔐 Sistema de Autenticación y Roles Unificado**
   - Roles jerárquicos con permisos granulares
   - Sistema de autenticación JWT
   - WebSocket con autenticación en tiempo real
   - Middleware de compatibilidad

5. **🔍 Sistema de Búsqueda Avanzada**
   - Búsqueda con filtros múltiples
   - Sugerencias inteligentes
   - Historial de búsquedas
   - Autocompletado contextual

6. **💬 Sistema de Comunicación Consolidado**
   - Tickets unificados con números automáticos
   - Sistema de mensajería
   - Soporte técnico integrado
   - Escalación automática

7. **⚙️ Servicios Técnicos Avanzados**
   - Monitoreo del sistema en tiempo real
   - Sistema de backup manual
   - Diagnósticos automáticos
   - Health checks completos

8. **🔄 Capa de Compatibilidad**
   - Migración automática de esquemas antiguos
   - Middlewares de traducción
   - Vistas de compatibilidad
   - Corrección de inconsistencias

## 🛠️ **Pasos de Despliegue**

### **Fase 1: Preparación del Entorno (30 minutos)**

1. **Verificar Prerequisites**
   ```bash
   node --version    # >= 18.x
   npm --version     # >= 8.x
   psql --version    # >= 12.x
   ```

2. **Variables de Entorno**
   ```bash
   # Crear archivo .env
   DATABASE_URL=postgresql://username:password@host:port/database
   JWT_SECRET=your-super-secure-jwt-secret-key
   NODE_ENV=production
   PORT=3000
   ```

3. **Instalar Dependencias**
   ```bash
   cd playtest-backend
   npm install
   ```

### **Fase 2: Migración de Base de Datos (45 minutos)**

1. **Ejecutar Migración Crítica**
   ```bash
   node critical-fixes-migration.js
   ```
   
   Esto realizará:
   - ✅ Unificación del sistema de roles
   - ✅ Corrección de `loaded_blocks`
   - ✅ Consolidación de comunicación
   - ✅ Implementación de Luminarias unificado
   - ✅ Creación de foreign keys faltantes
   - ✅ Limpieza de tablas duplicadas

2. **Ejecutar Migración de Niveles**
   ```bash
   node complete-levels-migration.js
   ```

3. **Verificar Migración**
   ```bash
   node functionality-verification.js
   ```

### **Fase 3: Configuración de Sistemas (20 minutos)**

1. **Configurar Challenges**
   ```bash
   # El sistema se autoconfigura al iniciar
   # Verificar en logs: "🎯 Sistema de challenges verificado"
   ```

2. **Verificar WebSocket**
   ```bash
   # Al iniciar el servidor debe mostrar:
   # "🔌 WebSocket server enabled"
   ```

3. **Verificar Compatibilidad**
   ```bash
   # En logs del servidor:
   # "✅ Sistema de tablas unificadas verificado"
   ```

### **Fase 4: Inicio del Sistema (10 minutos)**

1. **Iniciar Servidor**
   ```bash
   npm start
   # o en desarrollo:
   npm run dev
   ```

2. **Verificar Health Check**
   ```bash
   curl http://localhost:3000/health
   # Debe retornar: {"status":"OK","timestamp":"..."}
   ```

3. **Probar Endpoints Críticos**
   ```bash
   # Test de autenticación
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   
   # Test de niveles (requiere token)
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/levels/my-levels
   ```

## 🔧 **Configuración Avanzada**

### **Variables de Entorno Opcionales**
```bash
# Configuración de Redis (opcional)
REDIS_URL=redis://localhost:6379

# Configuración de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Configuración de pagos (opcional)
STRIPE_SECRET_KEY=sk_test_...
PAYPAL_CLIENT_ID=your-paypal-client-id
```

### **Configuración de Nginx (Producción)**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 **Monitoreo y Mantenimiento**

### **Logs Importantes a Monitorear**
```bash
# Verificar en logs de inicio:
✅ Connected to PostgreSQL database
✅ Sistema de roles unificados verificado
🏆 Sistema de niveles verificado y funcionando
🔌 WebSocket server enabled
🤖 Sistema de automatización de soporte iniciado
```

### **Comandos de Mantenimiento**
```bash
# Backup manual
node -e "
const TechnicalServices = require('./technical-services-advanced');
const ts = new TechnicalServices();
ts.createManualBackup().then(() => console.log('Backup completo'));
"

# Verificación de funcionalidades
node functionality-verification.js

# Limpiar logs antiguos
node -e "
const SearchSystem = require('./search-recent');
const ss = new SearchSystem();
ss.cleanupOldSearchHistory(90).then(() => console.log('Logs limpiados'));
"
```

### **Health Checks Automáticos**
```bash
# Crear script de monitoreo (monitor.sh)
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ $response != "200" ]; then
    echo "ALERT: Server health check failed - HTTP $response"
    # Aquí agregar notificación (email, Slack, etc.)
fi

# Ejecutar cada 5 minutos con cron
*/5 * * * * /path/to/monitor.sh
```

## 🚨 **Solución de Problemas Comunes**

### **Error: Tabla no existe**
```bash
# Ejecutar migración crítica
node critical-fixes-migration.js
```

### **Error: JWT Secret not defined**
```bash
# Configurar variable de entorno
export JWT_SECRET="your-very-secure-secret-key-here"
```

### **Error: Database connection failed**
```bash
# Verificar DATABASE_URL
echo $DATABASE_URL
# Debe ser: postgresql://user:pass@host:port/dbname

# Test de conexión directa
psql $DATABASE_URL -c "SELECT NOW();"
```

### **WebSocket no funciona**
```bash
# Verificar que no hay conflicto de puertos
netstat -tulpn | grep :3000

# Verificar CORS en configuración
# El servidor debe mostrar: "🔌 WebSocket server enabled"
```

## 📈 **Métricas de Rendimiento Esperadas**

| Métrica | Valor Esperado | Crítico Si |
|---------|----------------|------------|
| Tiempo respuesta API | < 200ms | > 2s |
| Conexiones DB | < 50 | > 100 |
| Uso CPU | < 50% | > 80% |
| Uso RAM | < 512MB | > 1GB |
| Tiempo WebSocket connect | < 100ms | > 1s |

## 🎯 **Endpoints Principales Disponibles**

### **Autenticación**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/refresh`

### **Sistema de Niveles**
- `GET /api/levels/my-levels`
- `GET /api/levels/leaderboard`
- `POST /api/levels/calculate`

### **Luminarias**
- `GET /api/luminarias/balance`
- `POST /api/luminarias/transaction`
- `POST /api/luminarias/withdraw`

### **Challenges**
- `GET /api/challenges`
- `POST /api/challenges/participate`
- `GET /api/challenges-advanced/analytics`

### **Búsqueda**
- `GET /api/search/global`
- `GET /api/search/suggestions`
- `GET /api/search/recent`

## 🏁 **Verificación Final**

Después del despliegue, verificar que estos elementos estén operativos:

1. ✅ **Base de datos**: Todas las tablas unificadas creadas
2. ✅ **Autenticación**: Login/registro funcionando
3. ✅ **Niveles**: Cálculo automático activo
4. ✅ **Luminarias**: Transacciones procesándose
5. ✅ **Challenges**: Sistema A/B testing activo
6. ✅ **WebSocket**: Conexiones en tiempo real
7. ✅ **Búsqueda**: Sugerencias y filtros funcionando
8. ✅ **Soporte**: Tickets generándose correctamente

## 🎉 **¡Sistema Listo!**

Si todos los checks pasan, el sistema PLAYTEST está completamente operativo con:

- **🏆 Sistema de niveles de 3 tipos con 15 niveles únicos**
- **💰 Economía virtual completa con Luminarias**
- **🎯 Challenges avanzados con A/B testing**
- **🔍 Búsqueda inteligente con sugerencias**
- **💬 Sistema de comunicación unificado**
- **⚙️ Servicios técnicos profesionales**
- **🔄 Compatibilidad total con sistemas legacy**

**El proyecto está listo para producción y escalamiento.**
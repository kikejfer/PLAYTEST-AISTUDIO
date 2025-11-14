# Guía de Solución de Problemas - PlayTest

## Error 500: Server Error

### Síntoma
El navegador muestra: "Failed to load resource: the server responded with a status of 500 ()"

### Causa Principal
El backend en Render.com no puede iniciar porque falta la variable de entorno `DATABASE_URL`.

### Solución

1. **Obtener la cadena de conexión de Aiven:**
   - Desde tu panel de Aiven o pgAdmin4
   - Formato: `postgresql://username:password@host:port/database?sslmode=no-verify`
   - Ejemplo: `postgresql://avnadmin:YOUR_PASSWORD@lumiquiz-db-enferlo-lumiquiz.d.aivencloud.com:12345/playtest?sslmode=no-verify`

2. **Configurar en Render.com:**
   - Ve a https://dashboard.render.com
   - Selecciona el servicio **playtest-backend**
   - Ve a **Environment** → Variables de entorno
   - Agrega/edita:
     - **Key:** `DATABASE_URL`
     - **Value:** Tu cadena de conexión de Aiven
   - Guarda y espera el redespliegue automático

3. **Verificar:**
   - Accede a `https://tu-backend.onrender.com/health`
   - Deberías ver: `{"status": "OK", "timestamp": "..."}`

### Variables de Entorno Requeridas en Render

Según `render.yaml`, estas son las variables necesarias:

| Variable | Descripción | Configuración |
|----------|-------------|---------------|
| `NODE_ENV` | Entorno de ejecución | `production` (automático) |
| `DATABASE_URL` | Conexión a PostgreSQL (Aiven) | **MANUAL** - Configurar en dashboard |
| `JWT_SECRET` | Secreto para tokens JWT | Generado automáticamente |
| `FRONTEND_URL` | URL del frontend | `https://playtest-frontend.onrender.com` |

### Archivo de Referencia
- `playtest-backend/database/connection.js:7-9` - Verifica DATABASE_URL
- `render.yaml:12-13` - Configuración de Render
- `server.js:174-180` - Manejador de errores 500

---

## Otros Problemas Comunes

### CORS Errors
**Síntoma:** "Not allowed by CORS" en la consola del navegador

**Solución:**
- Verifica que `FRONTEND_URL` en Render apunte a tu frontend correcto
- Revisa `server.js:39-76` para los orígenes permitidos

### Puerto en uso (desarrollo local)
**Síntoma:** "Error: listen EADDRINUSE: address already in use :::3000"

**Solución:**
```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Dependencias faltantes
**Síntoma:** "Error: Cannot find module 'express'"

**Solución:**
```bash
cd playtest-backend
npm install
```

---

## Verificación de Estado del Sistema

### Backend Health Check
```bash
curl https://tu-backend.onrender.com/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-11-14T08:30:00.000Z"
}
```

### Auto-setup Status
```bash
curl https://tu-backend.onrender.com/api/setup/status
```

### Ver logs en Render
1. Dashboard de Render → Tu servicio
2. **Logs** tab
3. Busca errores marcados con ❌

---

## Contacto y Recursos

- **Documentación de Render:** https://render.com/docs
- **Documentación de Aiven:** https://aiven.io/docs
- **Dashboard de Render:** https://dashboard.render.com

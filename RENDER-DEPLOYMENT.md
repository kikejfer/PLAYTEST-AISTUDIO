# PLAYTEST - Guía de Despliegue en Render

Esta guía explica cómo desplegar la aplicación PLAYTEST en Render con PostgreSQL.

## 📋 Prerrequisitos

- Cuenta en [Render](https://render.com)
- Repositorio de Git con el código
- Base de datos configurada correctamente

## 🚀 Pasos de Despliegue

### 1. Configurar Base de Datos PostgreSQL

1. En el dashboard de Render, crea un nuevo servicio PostgreSQL:
   - Nombre: `playtest-db`
   - Usuario: `playtest_user`
   - Base de datos: `playtest_db`
   - Plan: Free (para desarrollo)

2. Una vez creado, Render proporcionará:
   - `DATABASE_URL` (URL de conexión completa)
   - Host, Port, Database, Username, Password

### 2. Configurar Web Service (Backend)

1. En Render, crea un nuevo Web Service:
   - **Name**: `playtest-backend`
   - **Environment**: `Node`
   - **Region**: Oregon (US West) - recomendado
   - **Branch**: `main`
   - **Root Directory**: `backend` ⬅️ **IMPORTANTE: Usa este directorio**

2. **Build Command**:
   ```bash
   npm install
   ```

3. **Start Command**:
   ```bash
   npm start
   ```

4. **Plan**: Free (para desarrollo)

### 3. Variables de Entorno

Configura estas variables en Render:

#### Variables Obligatorias:
```bash
NODE_ENV=production
DATABASE_URL=[Auto-generada por Render PostgreSQL]
JWT_SECRET=[Auto-generar un valor seguro]
```

#### Variables Opcionales:
```bash
FRONTEND_URL=https://tu-frontend.onrender.com
PORT=3000
```

### 4. Configuración Automática

El backend incluye scripts de inicialización automática:

- **`init-render-db.js`**: Crea las tablas necesarias
- **`postbuild`**: Se ejecuta automáticamente después del build
- **Auto-setup**: El servidor crea automáticamente el AdminPrincipal

### 5. Deploy

1. Conecta tu repositorio GitHub a Render
2. Las variables se configuran automáticamente
3. El deploy se ejecuta automáticamente
4. La base de datos se inicializa en el primer deploy

## 🔧 Estructura de la Base de Datos

El sistema se inicializa automáticamente con estas tablas:

### Tablas Principales:
- `users` - Usuarios del sistema
- `user_profiles` - Perfiles extendidos de usuarios  
- `roles` - Roles del sistema
- `user_roles` - Relación usuarios-roles
- `blocks` - Bloques de preguntas
- `questions` - Preguntas individuales
- `answers` - Respuestas a las preguntas
- `games` - Sesiones de juego
- `user_sessions` - Sesiones de autenticación

### Roles por Defecto:
- `administrador_principal`
- `administrador_secundario`
- `creador_contenido`
- `profesor`
- `usuario`

## 📡 Endpoints de la API

Una vez desplegado, la API estará disponible en:
```
https://tu-backend.onrender.com/api/
```

### Endpoints principales:
- `POST /api/auth/register` - Registro de usuarios
- `POST /api/auth/login` - Login
- `GET /api/users/profile` - Perfil del usuario
- `GET /api/blocks` - Listar bloques
- `POST /api/blocks` - Crear bloque

## 🔒 Seguridad

### Configuración CORS:
El backend está configurado para permitir:
- `https://playtest-frontend.onrender.com`
- Dominio configurado en `FRONTEND_URL`
- Localhost (para desarrollo)

### JWT:
- Tokens seguros con expiración de 7 días
- Secret auto-generado por Render

### Base de Datos:
- Conexiones SSL en producción
- Índices optimizados para rendimiento

## 🐛 Troubleshooting

### Error: "No se puede conectar a la base de datos"
1. Verifica que `DATABASE_URL` esté configurada
2. Comprueba que el servicio PostgreSQL esté activo
3. Revisa los logs de Render

### Error: "CORS blocked"
1. Añade tu dominio frontend a las variables de entorno
2. Verifica la configuración de `FRONTEND_URL`

### Error: "JWT secret not found"
1. Configura la variable `JWT_SECRET` en Render
2. O permite que Render la auto-genere

### Logs:
```bash
# Ver logs en tiempo real desde Render dashboard
# O usar Render CLI
render logs -s tu-servicio
```

## 📈 Monitoreo

### Health Check:
El servidor incluye un endpoint de salud:
```
GET /api/health
```

### Métricas:
- Render proporciona métricas automáticas
- CPU, Memoria, Respuesta HTTP
- Logs estructurados disponibles

## 🔄 CI/CD

### Auto-Deploy:
- Push a `main` → Deploy automático
- Render detecta cambios en GitHub
- Build, test, y deploy automáticos

### Rollback:
- Render mantiene historial de deploys
- Rollback con un click desde dashboard

## 💡 Optimizaciones

### Performance:
- Gzip habilitado
- Rate limiting configurado
- Índices de base de datos optimizados

### Escalabilidad:
- Plan Starter para más recursos
- Múltiples regiones disponibles
- Auto-scaling en planes pagos

## 📝 Notas Importantes

1. **Primer Deploy**: Puede tomar más tiempo por inicialización de DB
2. **Free Plan**: Duerme después de 15 min de inactividad
3. **SSL**: Automático en todos los servicios de Render
4. **Backups**: PostgreSQL Free incluye backups automáticos

## 🔗 Enlaces Útiles

- [Render Docs](https://render.com/docs)
- [PostgreSQL en Render](https://render.com/docs/databases)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

## ✅ Checklist de Despliegue

- [ ] Repositorio conectado a Render
- [ ] Servicio PostgreSQL creado y activo
- [ ] Web Service configurado con variables de entorno
- [ ] Frontend URL configurada para CORS
- [ ] Primera instalación completada exitosamente
- [ ] Endpoint de salud respondiendo
- [ ] Registro de usuario funcional
- [ ] Login funcional
- [ ] AdminPrincipal creado automáticamente
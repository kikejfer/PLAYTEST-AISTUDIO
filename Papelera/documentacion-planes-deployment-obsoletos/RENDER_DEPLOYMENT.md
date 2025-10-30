# 🚀 Guía de Despliegue en Render - PLAYTEST

## ✅ Sistema Activado y Listo

El sistema persistente ha sido configurado automáticamente. Todos los archivos HTML principales
ahora incluyen el sistema persistente que funcionará automáticamente en Render.

## 📋 Pasos para Desplegar

### 1. Subir a GitHub
```bash
git add .
git commit -m "Activar sistema persistente para Render"
git push origin main
```

### 2. Configurar en Render.com

1. **Crear nuevo Web Service**
   - Conectar tu repositorio GitHub
   - Directorio raíz: `playtest-backend`
   - Usar `render.yaml` para configuración automática

2. **Variables de Entorno** (Se configuran automáticamente via render.yaml)
   - `NODE_ENV`: production
   - `JWT_SECRET`: Se genera automáticamente
   - `DATABASE_URL`: Se conecta automáticamente a PostgreSQL

3. **Base de Datos PostgreSQL**
   - Se crea automáticamente con `render.yaml`
   - Nombre: `playtest-db`
   - Usuario: `playtest_user`

### 3. Configurar Frontend (Opcional)

Si quieres servir el frontend desde Render también:

1. Crear otro Web Service para frontend
2. Usar archivos HTML actualizados
3. Configurar Static Site

### 4. URLs Resultantes

- **Backend**: `https://playtest-backend.onrender.com`
- **Frontend**: `https://tu-frontend.onrender.com` (si lo despliegas)

## 🔧 Configuración Automática

### Backend
- ✅ Todas las rutas API funcionando
- ✅ PostgreSQL conectado automáticamente
- ✅ Migración de tablas ejecutada al iniciar
- ✅ CORS configurado para frontend

### Frontend
- ✅ Sistema persistente incluido en archivos HTML
- ✅ Detección automática de URL de Render
- ✅ Migración automática de localStorage
- ✅ Fallback a localStorage si falla API

## 🎯 Funcionalidades Activas

Una vez desplegado, tendrás:
- ✅ **Persistencia real** en PostgreSQL
- ✅ **Feature flags** administrables
- ✅ **Preferencias de usuario** persistentes
- ✅ **Estados de juego** guardados automáticamente
- ✅ **Analytics** y métricas
- ✅ **Sistema de migración** automático

## 🔍 Verificación Post-Despliegue

1. Visitar: `https://tu-backend.onrender.com/health`
2. Debe retornar: `{"status": "OK", "timestamp": "..."}`
3. Verificar logs en Render dashboard
4. Probar login y funcionalidades básicas

## ⚡ Características del Sistema

- **Auto-detección**: El sistema detecta automáticamente si está en Render
- **Migración transparente**: Los usuarios no notan cambios
- **Fallback inteligente**: Funciona aunque falle PostgreSQL temporalmente
- **Cache inteligente**: Reduce llamadas API innecesarias
- **Monitoreo integrado**: Logs y analytics automáticos

¡El sistema está completamente listo para producción en Render! 🎉

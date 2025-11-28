# Guía de Migración del Sistema de Luminarias

## Problema

Al jugar en modo clásico en producción, se presentaban dos errores:

1. **Error 404 en `/api/luminarias/transaction`**
   - ✅ **RESUELTO**: Se corrigió `luminarias-manager.js` para usar la URL correcta del backend en producción

2. **Error 500 en `/api/luminarias/balance` y `/api/games/:id/scores`**
   - ❌ **PENDIENTE**: Las tablas y funciones de Luminarias no existen en la base de datos de producción

## Solución

### Paso 1: Ejecutar Migraciones Críticas

El sistema de Luminarias requiere que se ejecute el esquema de base de datos en producción.

#### Opción A: Ejecutar en Render.com (Recomendado)

1. Ve al dashboard de Render.com
2. Abre la sección "Shell" de tu servicio backend
3. Ejecuta el siguiente comando:

```bash
node playtest-backend/run-critical-migrations.js
```

Este script ejecutará automáticamente:
- ✅ Creación de tablas de Luminarias
- ✅ Creación de funciones de base de datos (`get_user_luminarias_stats`, `process_luminarias_transaction`)
- ✅ Configuración inicial de valores
- ✅ Creación de cuentas de Luminarias para usuarios existentes (200 Luminarias iniciales)

#### Opción B: Ejecutar localmente contra producción

```bash
# Desde la raíz del proyecto
export DATABASE_URL="postgresql://user:password@host:port/database"
export NODE_ENV="production"
node playtest-backend/run-critical-migrations.js
```

⚠️ **IMPORTANTE**: Asegúrate de tener las credenciales correctas de producción.

### Paso 2: Verificar la Instalación

Después de ejecutar la migración, verifica que todo esté correcto:

```bash
# El script mostrará algo como:
✅ Luminarias schema applied successfully
✅ 50 users have Luminarias accounts
✅ user_luminarias exists
✅ luminarias_transactions exists
✅ luminarias_config exists
```

### Paso 3: Reiniciar el Servidor

Después de ejecutar la migración, reinicia el servicio en Render.com para aplicar todos los cambios.

## Componentes del Sistema de Luminarias

### Tablas Principales

1. **`user_luminarias`**: Balance de cada usuario
2. **`luminarias_transactions`**: Historial de transacciones
3. **`luminarias_config`**: Configuración de valores
4. **`luminarias_store_items`**: Items de la tienda
5. **`luminarias_purchases`**: Compras realizadas
6. **`luminarias_marketplace`**: Servicios del marketplace
7. **`luminarias_conversions`**: Conversiones a dinero real

### Funciones de Base de Datos

1. **`process_luminarias_transaction()`**: Procesa transacciones y actualiza balances
2. **`get_user_luminarias_stats()`**: Obtiene estadísticas del usuario

## Troubleshooting

### Error: "relation does not exist"

```
ERROR: relation "user_luminarias" does not exist
```

**Solución**: Ejecuta el script de migraciones críticas.

### Error: "function does not exist"

```
ERROR: function get_user_luminarias_stats(integer) does not exist
```

**Solución**: Ejecuta el script de migraciones críticas.

### Error de permisos

```
ERROR: permission denied for table user_luminarias
```

**Solución**: Verifica que el usuario de la base de datos tenga permisos suficientes.

## Archivos Relacionados

- `database-schema-luminarias.sql` - Esquema completo del sistema
- `playtest-backend/run-critical-migrations.js` - Script de migración
- `playtest-backend/update-luminarias-schema.js` - Script específico de Luminarias
- `playtest-backend/routes/luminarias.js` - Endpoints de la API
- `luminarias-manager.js` - Cliente JavaScript

## Estado Actual

- ✅ Frontend corregido para usar URL correcta en producción
- ✅ Script de migración actualizado
- ⏳ Pendiente: Ejecutar migración en Render.com
- ⏳ Pendiente: Verificar funcionamiento en producción

## Testing Después de la Migración

1. Jugar una partida en modo clásico
2. Verificar que se otorgan Luminarias correctamente
3. Verificar que el balance se actualiza
4. Verificar que la notificación de recompensa aparece
5. No debe haber errores 500 en la consola

## Contacto

Si encuentras problemas con la migración, verifica:
1. Los logs del servidor en Render.com
2. La conexión a la base de datos
3. Los permisos del usuario de la base de datos

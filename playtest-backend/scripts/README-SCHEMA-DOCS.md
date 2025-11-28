# Scripts de Documentación del Esquema de Base de Datos

Este directorio contiene scripts para generar automáticamente la documentación del esquema de la base de datos PostgreSQL de PLAYTEST.

## Scripts Disponibles

### 1. `generate-schema-docs-from-sql.js` (Recomendado)

**Genera documentación leyendo archivos SQL locales - NO requiere conexión a base de datos**

```bash
# Desde el directorio playtest-backend
npm run docs:schema

# O directamente con node
node scripts/generate-schema-docs-from-sql.js [ruta-salida.md]
```

**Características:**
- ✅ No requiere conexión a base de datos
- ✅ Lee archivos `database-schema-*.sql` del proyecto
- ✅ Documenta: tablas, columnas, índices, triggers, funciones, vistas, constraints
- ✅ Genera archivo markdown en la raíz del proyecto: `DATABASE_SCHEMA_DOCS.md`
- ✅ Incluye diagrama de relaciones (foreign keys)

**Archivos SQL procesados:**
- `database-schema.sql` (esquema base)
- `database-schema-roles.sql` (sistema de roles)
- `database-schema-communication.sql` (sistema de tickets)
- `database-schema-direct-messaging.sql` (mensajería directa)
- `database-schema-support.sql` (soporte técnico)
- `database-schema-creators-panel.sql` (panel de creadores)
- `database-schema-teachers-panel.sql` (panel de profesores)
- `database-schema-integrations.sql` (integraciones)
- `database-schema-luminarias.sql` (sistema de puntos)

---

### 2. `extract-database-schema.js`

**Extrae documentación directamente de la base de datos PostgreSQL - REQUIERE conexión**

```bash
# Desde el directorio playtest-backend
npm run docs:schema:live

# O directamente con node
node scripts/extract-database-schema.js [ruta-salida.md]
```

**Características:**
- ⚠️ Requiere conexión a base de datos (variable `DATABASE_URL`)
- ✅ Extrae información en tiempo real de la base de datos
- ✅ Incluye información precisa de tipos de datos, constraints, índices
- ✅ Útil para verificar estado actual de la base de datos

**Requisitos:**
- Variable de entorno `DATABASE_URL` configurada
- Conexión SSL válida (archivo `ca.pem` en directorio `database/`)

---

## Salida Generada

Ambos scripts generan un archivo markdown (`DATABASE_SCHEMA_DOCS.md`) con:

### Estructura del documento:

1. **Resumen**: Estadísticas generales (número de tablas, índices, triggers, etc.)

2. **Tabla de Contenidos**: Enlaces a todas las secciones

3. **Detalle de Tablas**: Para cada tabla incluye:
   - Lista de columnas con tipos, nullability, valores por defecto
   - Constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK)
   - Relaciones (foreign keys con detalles ON DELETE/UPDATE)
   - Índices asociados
   - Triggers asociados

4. **Vistas**: Definición SQL de cada vista

5. **Funciones y Procedimientos**: Código completo de funciones PL/pgSQL

6. **Diagrama de Relaciones**: Texto plano mostrando todas las foreign keys

### Ejemplo de salida:

```markdown
### Tabla: `users`

#### Columnas

| Nombre | Tipo | Nulable | Por Defecto | Descripción |
|--------|------|---------|-------------|-------------|
| `id` | SERIAL | ❌ No | `-` | PRIMARY KEY |
| `nickname` | VARCHAR(50) | ❌ No | `-` | UNIQUE |
| `email` | VARCHAR(100) | ✅ Sí | `-` | |
| `password_hash` | VARCHAR(255) | ❌ No | `-` | |
| `created_at` | TIMESTAMP | ✅ Sí | `CURRENT_TIMESTAMP` | |

#### Relaciones (Foreign Keys)
...
```

---

## Uso Recomendado

### Para desarrollo local:
```bash
npm run docs:schema
```

### Para verificar base de datos en producción:
```bash
npm run docs:schema:live
```

### Para consultar la estructura antes de modificaciones:
```bash
# 1. Genera la documentación
npm run docs:schema

# 2. Abre el archivo generado
cat ../../DATABASE_SCHEMA_DOCS.md

# 3. Usa el archivo como referencia para planificar cambios
```

---

## Beneficios

1. **Consulta rápida**: No necesitas conectarte a la base de datos para ver la estructura
2. **Documentación siempre actualizada**: Ejecuta el script después de cada migración
3. **Referencia para desarrollo**: Útil para entender relaciones entre tablas
4. **Control de versiones**: El archivo .md puede incluirse en git para trackear cambios de esquema
5. **Mejora de estructura**: Facilita identificar optimizaciones sin crear tablas nuevas

---

## Notas

- El archivo `DATABASE_SCHEMA_DOCS.md` se genera en la raíz del proyecto (dos niveles arriba de `scripts/`)
- Puedes especificar una ruta personalizada como argumento: `node script.js /ruta/custom.md`
- Se recomienda regenerar la documentación después de ejecutar migraciones
- Los scripts eliminan duplicados automáticamente si hay definiciones repetidas en múltiples archivos SQL

---

## Mantenimiento

Para agregar nuevos archivos de esquema SQL al script:

Edita `generate-schema-docs-from-sql.js` y agrega el archivo en el array `schemaFiles`:

```javascript
const schemaFiles = [
  'database-schema.sql',
  'database-schema-roles.sql',
  // ... otros archivos ...
  'tu-nuevo-archivo-schema.sql',  // ← Agregar aquí
];
```

# Migraciones de Base de Datos

## Migración: create-block-assignments-table.sql

### Propósito
Crea la tabla `block_assignments` necesaria para almacenar las asignaciones de bloques de preguntas a grupos o estudiantes individuales.

### Por qué es necesaria
El endpoint `/api/groups/assignments` fallaba con error 500 porque la tabla `block_assignments` no existía en la base de datos.

### Cómo ejecutar la migración

#### Opción 1: Usando el script Node.js (Recomendado)

```bash
cd playtest-backend
node run-block-assignments-migration.js
```

Este script:
- Lee el archivo SQL de migración
- Ejecuta la migración dentro de una transacción
- Verifica que la tabla fue creada correctamente
- Muestra la estructura de la tabla e índices

#### Opción 2: Ejecutar SQL directamente

Si prefieres ejecutar el SQL manualmente:

1. **En Render.com Dashboard:**
   - Ve a tu servicio de PostgreSQL
   - Click en "Shell" o "Connect"
   - Copia y pega el contenido de `create-block-assignments-table.sql`

2. **Usando psql localmente:**
   ```bash
   psql $DATABASE_URL < migrations/create-block-assignments-table.sql
   ```

3. **Usando pgAdmin o DBeaver:**
   - Conecta a tu base de datos de PostgreSQL
   - Abre una nueva query window
   - Pega el contenido de `create-block-assignments-table.sql`
   - Ejecuta

### Estructura de la tabla creada

```sql
block_assignments (
    id                  SERIAL PRIMARY KEY,
    block_id            INTEGER NOT NULL REFERENCES blocks(id),
    assigned_by         INTEGER NOT NULL REFERENCES users(id),
    group_id            INTEGER REFERENCES groups(id),
    assigned_to_user    INTEGER REFERENCES users(id),
    due_date            TIMESTAMP,
    notes               TEXT,
    assigned_at         TIMESTAMP DEFAULT NOW()
)
```

### Índices creados

- `idx_block_assignments_block` - Para búsquedas por bloque
- `idx_block_assignments_assigned_by` - Para búsquedas por profesor
- `idx_block_assignments_group` - Para asignaciones a grupos
- `idx_block_assignments_user` - Para asignaciones individuales
- `idx_block_assignments_due_date` - Para búsquedas por fecha límite
- `idx_block_assignments_assigned_by_date` - Para ordenar por fecha

### Verificación

Después de ejecutar la migración, verifica que la tabla existe:

```sql
SELECT * FROM block_assignments LIMIT 1;
```

También puedes verificar la estructura:

```sql
\d block_assignments
```

### Rollback

Si necesitas deshacer la migración:

```sql
DROP TABLE IF EXISTS block_assignments CASCADE;
```

**⚠️ ADVERTENCIA:** Esto eliminará todas las asignaciones de bloques existentes.

### Dependencias

Esta tabla depende de:
- `blocks` - Debe existir antes de crear esta tabla
- `users` - Debe existir antes de crear esta tabla
- `groups` - Debe existir antes de crear esta tabla

### Próximos pasos

Una vez ejecutada la migración:
1. Reinicia el servidor backend en Render.com
2. El endpoint `/api/groups/assignments` debería funcionar correctamente
3. Podrás ver las asignaciones de bloques en el panel de profesores

# 🛠️ Herramientas de Base de Datos - PLAYTEST

Este conjunto de herramientas te permite **consultar, analizar y mejorar la estructura de tu base de datos sin necesidad de crear nuevas tablas**.

---

## 📚 Recursos Disponibles

### 1. 📄 Documentación del Esquema
**Archivo**: `DATABASE_SCHEMA_DOCS.md`

Documentación completa y actualizada del esquema de base de datos con:
- ✅ 27 tablas documentadas
- ✅ 51 índices
- ✅ 26 triggers
- ✅ 28 funciones
- ✅ 4 vistas
- ✅ Diagrama de relaciones (Foreign Keys)

**Cómo generarla**:
```bash
# Desde archivos SQL (no requiere conexión a BD)
npm run docs:schema

# Desde base de datos en vivo (requiere DATABASE_URL)
npm run docs:schema:live
```

---

### 2. 🔍 Análisis Automático del Esquema
**Script**: `playtest-backend/scripts/analyze-schema.js`

Analiza tu base de datos y proporciona recomendaciones automáticas sobre:
- Foreign keys sin índices
- Columnas comunes sin índices (email, status, etc.)
- Tablas sin timestamps
- Tablas que podrían beneficiarse de soft delete
- Índices no utilizados (candidatos para eliminar)
- Tamaño de tablas

**Cómo ejecutarlo**:
```bash
cd playtest-backend
npm run analyze:schema
```

**Ejemplo de salida**:
```
╔════════════════════════════════════════════════════════════╗
║   Análisis de Esquema de Base de Datos - PLAYTEST        ║
╚════════════════════════════════════════════════════════════╝

📊 Analizando índices...
✓ Encontradas 42 foreign keys
⚠️  Se encontraron 3 foreign keys sin índices:

  ✗ tickets.created_by
    Razón: FK a users.id sin índice
    Sugerencia: CREATE INDEX idx_tickets_created_by ON tickets(created_by);

🔍 Analizando columnas comunes...
💡 Se encontraron 2 columnas comunes sin índices:

  ! blocks.status
    Razón: Columna común 'status' probablemente usada en filtros/búsquedas
    Sugerencia: CREATE INDEX idx_blocks_status ON blocks(status);

⏰ Analizando timestamps...
✓ Todas las tablas tienen timestamps apropiados

🗑️  Analizando soft delete...
💡 3 tablas podrían beneficiarse de soft delete:

  ! users
    Razón: Permite recuperar datos eliminados accidentalmente
    Sugerencia:
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
    CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

📈 Analizando cardinalidad de índices...
✓ Todos los índices se están usando

💾 Analizando tamaño de tablas...
Top 10 tablas por tamaño:

  👑 questions                      15 MB
  📊 answers                        8 MB
  📊 blocks                         2 MB

╔════════════════════════════════════════════════════════════╗
║                      RESUMEN                               ║
╚════════════════════════════════════════════════════════════╝

Total de recomendaciones: 8

  • missing_index: 3
  • common_column_no_index: 2
  • missing_soft_delete: 3
```

**Nota**: Requiere variable de entorno `DATABASE_URL` configurada.

---

### 3. 📖 Queries Útiles
**Archivo**: `playtest-backend/scripts/useful-queries.sql`

Colección de +50 queries SQL listas para usar, organizadas por categoría:

1. **Información General de Tablas** - Ver todas las tablas con tamaños
2. **Columnas de una Tabla** - Estructura detallada
3. **Relaciones (Foreign Keys)** - Ver todas las conexiones entre tablas
4. **Índices** - Estadísticas de uso, índices no utilizados, duplicados
5. **Constraints** - Ver todas las restricciones
6. **Triggers y Funciones** - Listar y ver definiciones
7. **Vistas** - Ver definiciones de vistas
8. **Análisis de Rendimiento** - Identificar queries lentas, cache hit ratio
9. **Bloat y Mantenimiento** - Detectar tablas con registros muertos
10. **Seguridad y Permisos** - Ver permisos de usuarios
11. **Queries de Mejora** - Templates para optimizaciones
12. **Búsqueda en Metadata** - Encontrar tablas/columnas
13. **Contadores y Estadísticas** - Contar registros

**Cómo usarlo**:
```bash
# Ver el archivo
cat playtest-backend/scripts/useful-queries.sql

# Ejecutar una query específica (con psql)
psql $DATABASE_URL -f playtest-backend/scripts/useful-queries.sql

# O copiar y pegar queries individuales en pgAdmin, DBeaver, etc.
```

---

### 4. 💡 Guía de Mejoras Sin Nuevas Tablas
**Archivo**: `MEJORAS_ESQUEMA_SIN_NUEVAS_TABLAS.md`

Guía completa con 10 estrategias para mejorar tu esquema:

1. ✅ **Agregar Columnas a Tablas Existentes** - Extender funcionalidad
2. ✅ **Optimizar Índices** - Mejorar rendimiento de queries
3. ✅ **Mejorar Constraints** - Garantizar integridad de datos
4. ✅ **Agregar Soft Delete** - Recuperar datos eliminados
5. ✅ **Columnas JSONB** - Flexibilidad sin cambiar esquema
6. ✅ **Timestamps y Auditoría** - Rastrear cambios
7. ✅ **Triggers** - Automatizar lógica de negocio
8. ✅ **Optimización de Tipos** - Reducir espacio y mejorar rendimiento
9. ✅ **Particionamiento Lógico** - Organizar datos eficientemente
10. ✅ **Vistas Materializadas** - Pre-calcular queries complejas

Incluye:
- 📝 Ejemplos prácticos con código SQL
- ✅ Beneficios de cada estrategia
- 🚀 Plan de implementación recomendado
- 📊 Herramientas de monitoreo
- ✅ Checklist de mejoras

**Cómo usarlo**:
```bash
# Leer la guía
cat MEJORAS_ESQUEMA_SIN_NUEVAS_TABLAS.md

# O abrirla en tu editor preferido
```

---

## 🚀 Flujo de Trabajo Recomendado

### Paso 1: Generar Documentación Actual
```bash
cd playtest-backend
npm run docs:schema
```

Esto genera `DATABASE_SCHEMA_DOCS.md` con toda la estructura actual.

### Paso 2: Analizar el Esquema
```bash
npm run analyze:schema
```

Esto te dará recomendaciones automáticas de mejoras.

### Paso 3: Consultar la Documentación
```bash
# Buscar una tabla específica
grep -A 20 "### Tabla: \`users\`" ../DATABASE_SCHEMA_DOCS.md

# Ver todas las relaciones
grep "FK →" ../DATABASE_SCHEMA_DOCS.md
```

### Paso 4: Usar Queries Útiles
```bash
# Ver estructura de una tabla
psql $DATABASE_URL -c "
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
"

# O ejecutar queries del archivo
psql $DATABASE_URL < scripts/useful-queries.sql
```

### Paso 5: Aplicar Mejoras
Consulta `MEJORAS_ESQUEMA_SIN_NUEVAS_TABLAS.md` para ver ejemplos de:
- Agregar columnas
- Crear índices
- Agregar constraints
- Implementar soft delete
- Y más...

### Paso 6: Re-generar Documentación
```bash
# Después de hacer cambios
npm run docs:schema

# O desde BD en vivo
npm run docs:schema:live
```

---

## 📋 Casos de Uso Comunes

### Caso 1: "Quiero ver la estructura completa de mi BD"
```bash
npm run docs:schema
cat ../DATABASE_SCHEMA_DOCS.md
```

### Caso 2: "Quiero saber qué tablas referencian a 'users'"
Busca en `DATABASE_SCHEMA_DOCS.md` o ejecuta:
```sql
-- Ver en useful-queries.sql, sección "3. RELACIONES"
```

### Caso 3: "Mi app está lenta, ¿qué índices me faltan?"
```bash
npm run analyze:schema
```
Te dirá exactamente qué índices te faltan.

### Caso 4: "Quiero agregar una columna 'status' a 'blocks'"
Consulta `MEJORAS_ESQUEMA_SIN_NUEVAS_TABLAS.md`, sección "1. Agregar Columnas".

Ejemplo:
```sql
ALTER TABLE blocks ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE blocks ADD CONSTRAINT blocks_valid_status
    CHECK (status IN ('draft', 'published', 'archived'));
CREATE INDEX idx_blocks_status ON blocks(status);
```

### Caso 5: "¿Qué índices no se están usando?"
Ejecuta la query de `useful-queries.sql`:
```sql
-- Índices que NUNCA se han usado
SELECT schemaname, tablename, indexname,
       pg_size_pretty(pg_relation_size(indexrelid)) AS espacio
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

### Caso 6: "Quiero implementar soft delete"
Consulta `MEJORAS_ESQUEMA_SIN_NUEVAS_TABLAS.md`, sección "4. Agregar Soft Delete".

---

## 🛠️ Scripts Disponibles

| Comando | Descripción | Requiere DB |
|---------|-------------|-------------|
| `npm run docs:schema` | Genera docs desde archivos SQL | ❌ No |
| `npm run docs:schema:live` | Extrae docs desde BD en vivo | ✅ Sí |
| `npm run analyze:schema` | Análisis automático con recomendaciones | ✅ Sí |

---

## 📁 Estructura de Archivos

```
PLAYTEST-AISTUDIO/
├── DATABASE_SCHEMA_DOCS.md              # 📄 Documentación generada
├── MEJORAS_ESQUEMA_SIN_NUEVAS_TABLAS.md # 💡 Guía de mejoras
├── DATABASE_TOOLS_README.md             # 📖 Este archivo
│
└── playtest-backend/
    ├── package.json                     # Scripts npm
    │
    └── scripts/
        ├── README-SCHEMA-DOCS.md        # Docs de los scripts
        ├── generate-schema-docs-from-sql.js  # Genera docs desde SQL
        ├── extract-database-schema.js   # Extrae docs desde BD
        ├── analyze-schema.js            # Análisis automático
        └── useful-queries.sql           # 50+ queries útiles
```

---

## 💡 Tips y Buenas Prácticas

### ✅ DO's

1. **Regenera la documentación después de cambios**
   ```bash
   npm run docs:schema
   ```

2. **Usa el análisis antes de optimizar**
   ```bash
   npm run analyze:schema
   ```

3. **Prueba en desarrollo primero**
   ```bash
   # Conecta a BD de desarrollo
   export DATABASE_URL="postgresql://..."
   npm run analyze:schema
   ```

4. **Usa CREATE INDEX CONCURRENTLY en producción**
   ```sql
   CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
   ```

5. **Documenta tus cambios**
   Agrega comentarios en tus migraciones explicando el "por qué".

### ❌ DON'Ts

1. **No elimines índices sin verificar uso**
   Primero verifica con el script de análisis.

2. **No hagas ALTER TABLE directamente en producción**
   Usa migraciones versionadas.

3. **No agregues índices "por si acaso"**
   Los índices tienen costo: espacio en disco y tiempo en writes.

4. **No ignores las recomendaciones del análisis**
   Están basadas en best practices de PostgreSQL.

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'pg'"
```bash
cd playtest-backend
npm install
```

### Error: "DATABASE_URL no está definida"
```bash
# En desarrollo
export DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

# O crea un archivo .env
echo "DATABASE_URL=postgresql://..." > .env
```

### El análisis no muestra recomendaciones
¡Excelente! Significa que tu esquema está bien optimizado.

### No puedo ejecutar queries en producción
Usa `useful-queries.sql` - todas las queries son de solo lectura y seguras.

---

## 📞 Soporte

Si tienes preguntas o encuentras problemas:

1. Consulta `DATABASE_SCHEMA_DOCS.md` para ver la estructura
2. Revisa `MEJORAS_ESQUEMA_SIN_NUEVAS_TABLAS.md` para ejemplos
3. Ejecuta `npm run analyze:schema` para diagnóstico automático
4. Revisa `useful-queries.sql` para queries específicas

---

## 🎯 Próximos Pasos

1. ✅ Genera la documentación inicial: `npm run docs:schema`
2. ✅ Ejecuta el análisis: `npm run analyze:schema`
3. ✅ Revisa las recomendaciones
4. ✅ Consulta la guía de mejoras
5. ✅ Implementa las optimizaciones necesarias
6. ✅ Regenera la documentación

---

**¡Tu base de datos, documentada y optimizada! 🚀**

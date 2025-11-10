#!/usr/bin/env node

/**
 * Script para extraer el esquema completo de la base de datos PostgreSQL
 * y generar documentación en formato Markdown
 *
 * Uso: node extract-database-schema.js [output-file.md]
 */

const { pool } = require('../database/connection');
const fs = require('fs');
const path = require('path');

// Archivo de salida (por defecto en la raíz del proyecto)
const outputFile = process.argv[2] || path.join(__dirname, '../../DATABASE_SCHEMA_DOCS.md');

/**
 * Query para obtener todas las tablas del esquema public
 */
const getTablesQuery = `
  SELECT
    tablename,
    schemaname
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
`;

/**
 * Query para obtener columnas de una tabla
 */
const getColumnsQuery = `
  SELECT
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable,
    udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = $1
  ORDER BY ordinal_position;
`;

/**
 * Query para obtener constraints de una tabla
 */
const getConstraintsQuery = `
  SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
      WHEN 'p' THEN 'PRIMARY KEY'
      WHEN 'f' THEN 'FOREIGN KEY'
      WHEN 'u' THEN 'UNIQUE'
      WHEN 'c' THEN 'CHECK'
      ELSE con.contype::text
    END AS constraint_type_desc,
    pg_get_constraintdef(con.oid) AS constraint_definition
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = connamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = $1
  ORDER BY con.contype, con.conname;
`;

/**
 * Query para obtener índices de una tabla
 */
const getIndexesQuery = `
  SELECT
    indexname,
    indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = $1
    AND indexname NOT LIKE '%_pkey'
  ORDER BY indexname;
`;

/**
 * Query para obtener triggers de una tabla
 */
const getTriggersQuery = `
  SELECT
    tgname AS trigger_name,
    pg_get_triggerdef(t.oid) AS trigger_definition
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = $1
    AND NOT tgisinternal
  ORDER BY tgname;
`;

/**
 * Query para obtener vistas
 */
const getViewsQuery = `
  SELECT
    viewname,
    definition
  FROM pg_views
  WHERE schemaname = 'public'
  ORDER BY viewname;
`;

/**
 * Query para obtener funciones y procedimientos
 */
const getFunctionsQuery = `
  SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition,
    pg_catalog.pg_get_function_result(p.oid) AS return_type,
    pg_catalog.pg_get_function_arguments(p.oid) AS arguments
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind IN ('f', 'p')
  ORDER BY p.proname;
`;

/**
 * Query para obtener foreign keys con detalles
 */
const getForeignKeysQuery = `
  SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule,
    rc.update_rule
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = $1
  ORDER BY tc.constraint_name;
`;

/**
 * Función principal
 */
async function extractSchema() {
  let markdown = '';

  try {
    console.log('🔍 Conectando a la base de datos...');

    // Encabezado del documento
    markdown += '# Esquema de Base de Datos - PLAYTEST\n\n';
    markdown += `> Generado automáticamente el ${new Date().toLocaleString('es-ES')}\n\n`;
    markdown += '---\n\n';
    markdown += '## Tabla de Contenidos\n\n';

    // Obtener todas las tablas
    console.log('📋 Obteniendo lista de tablas...');
    const tablesResult = await pool.query(getTablesQuery);
    const tables = tablesResult.rows;

    // Generar índice de tablas
    markdown += '### Tablas\n\n';
    tables.forEach(table => {
      markdown += `- [${table.tablename}](#tabla-${table.tablename})\n`;
    });
    markdown += '\n';

    // Obtener vistas
    console.log('👁️  Obteniendo vistas...');
    const viewsResult = await pool.query(getViewsQuery);
    const views = viewsResult.rows;

    if (views.length > 0) {
      markdown += '### Vistas\n\n';
      views.forEach(view => {
        markdown += `- [${view.viewname}](#vista-${view.viewname})\n`;
      });
      markdown += '\n';
    }

    // Obtener funciones
    console.log('⚙️  Obteniendo funciones...');
    const functionsResult = await pool.query(getFunctionsQuery);
    const functions = functionsResult.rows;

    if (functions.length > 0) {
      markdown += '### Funciones y Procedimientos\n\n';
      functions.forEach(func => {
        markdown += `- [${func.function_name}](#función-${func.function_name})\n`;
      });
      markdown += '\n';
    }

    markdown += '---\n\n';
    markdown += '## Detalle de Tablas\n\n';

    // Procesar cada tabla
    for (const table of tables) {
      console.log(`\n📊 Procesando tabla: ${table.tablename}`);

      markdown += `### Tabla: \`${table.tablename}\`\n\n`;

      // Obtener columnas
      const columnsResult = await pool.query(getColumnsQuery, [table.tablename]);
      const columns = columnsResult.rows;

      if (columns.length > 0) {
        markdown += '#### Columnas\n\n';
        markdown += '| Nombre | Tipo | Nulable | Por Defecto |\n';
        markdown += '|--------|------|---------|-------------|\n';

        columns.forEach(col => {
          const dataType = col.character_maximum_length
            ? `${col.data_type}(${col.character_maximum_length})`
            : col.data_type;
          const nullable = col.is_nullable === 'YES' ? '✅' : '❌';
          const defaultValue = col.column_default || '-';

          markdown += `| \`${col.column_name}\` | ${dataType} | ${nullable} | ${defaultValue} |\n`;
        });
        markdown += '\n';
      }

      // Obtener constraints
      const constraintsResult = await pool.query(getConstraintsQuery, [table.tablename]);
      const constraints = constraintsResult.rows;

      if (constraints.length > 0) {
        markdown += '#### Constraints\n\n';
        constraints.forEach(con => {
          markdown += `- **${con.constraint_type_desc}**: \`${con.constraint_name}\`\n`;
          markdown += `  - ${con.constraint_definition}\n`;
        });
        markdown += '\n';
      }

      // Obtener foreign keys con detalles
      const fkResult = await pool.query(getForeignKeysQuery, [table.tablename]);
      const foreignKeys = fkResult.rows;

      if (foreignKeys.length > 0) {
        markdown += '#### Relaciones (Foreign Keys)\n\n';
        foreignKeys.forEach(fk => {
          markdown += `- \`${fk.column_name}\` → \`${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
          markdown += `  - ON DELETE: ${fk.delete_rule}\n`;
          markdown += `  - ON UPDATE: ${fk.update_rule}\n`;
        });
        markdown += '\n';
      }

      // Obtener índices
      const indexesResult = await pool.query(getIndexesQuery, [table.tablename]);
      const indexes = indexesResult.rows;

      if (indexes.length > 0) {
        markdown += '#### Índices\n\n';
        indexes.forEach(idx => {
          markdown += `- \`${idx.indexname}\`\n`;
          markdown += `  \`\`\`sql\n  ${idx.indexdef}\n  \`\`\`\n`;
        });
        markdown += '\n';
      }

      // Obtener triggers
      const triggersResult = await pool.query(getTriggersQuery, [table.tablename]);
      const triggers = triggersResult.rows;

      if (triggers.length > 0) {
        markdown += '#### Triggers\n\n';
        triggers.forEach(trg => {
          markdown += `- \`${trg.trigger_name}\`\n`;
          markdown += `  \`\`\`sql\n  ${trg.trigger_definition}\n  \`\`\`\n`;
        });
        markdown += '\n';
      }

      markdown += '---\n\n';
    }

    // Procesar vistas
    if (views.length > 0) {
      markdown += '## Vistas\n\n';

      views.forEach(view => {
        console.log(`👁️  Procesando vista: ${view.viewname}`);
        markdown += `### Vista: \`${view.viewname}\`\n\n`;
        markdown += '```sql\n';
        markdown += `CREATE VIEW ${view.viewname} AS\n${view.definition}\n`;
        markdown += '```\n\n';
        markdown += '---\n\n';
      });
    }

    // Procesar funciones
    if (functions.length > 0) {
      markdown += '## Funciones y Procedimientos\n\n';

      functions.forEach(func => {
        console.log(`⚙️  Procesando función: ${func.function_name}`);
        markdown += `### Función: \`${func.function_name}\`\n\n`;

        if (func.arguments) {
          markdown += `**Argumentos**: \`${func.arguments}\`\n\n`;
        }

        if (func.return_type) {
          markdown += `**Retorna**: \`${func.return_type}\`\n\n`;
        }

        markdown += '```sql\n';
        markdown += func.function_definition;
        markdown += '\n```\n\n';
        markdown += '---\n\n';
      });
    }

    // Guardar archivo
    console.log(`\n💾 Guardando documentación en: ${outputFile}`);
    fs.writeFileSync(outputFile, markdown, 'utf8');

    console.log('✅ ¡Documentación generada exitosamente!');
    console.log(`📄 Archivo: ${outputFile}`);
    console.log(`📊 Tablas documentadas: ${tables.length}`);
    console.log(`👁️  Vistas documentadas: ${views.length}`);
    console.log(`⚙️  Funciones documentadas: ${functions.length}`);

  } catch (error) {
    console.error('❌ Error al extraer el esquema:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar
extractSchema()
  .then(() => {
    console.log('\n🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

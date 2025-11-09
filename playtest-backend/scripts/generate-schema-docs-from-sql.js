#!/usr/bin/env node

/**
 * Script para generar documentación del esquema de base de datos
 * a partir de los archivos SQL de esquema existentes
 *
 * No requiere conexión a base de datos - lee archivos .sql
 *
 * Uso: node generate-schema-docs-from-sql.js [output-file.md]
 */

const fs = require('fs');
const path = require('path');

// Archivo de salida
const outputFile = process.argv[2] || path.join(__dirname, '../../DATABASE_SCHEMA_DOCS.md');

// Directorio raíz del proyecto
const projectRoot = path.join(__dirname, '../..');

// Archivos de esquema a procesar (en orden de importancia)
const schemaFiles = [
  'database-schema.sql',
  'database-schema-roles.sql',
  'database-schema-communication.sql',
  'database-schema-direct-messaging.sql',
  'database-schema-support.sql',
  'database-schema-creators-panel.sql',
  'database-schema-teachers-panel.sql',
  'database-schema-integrations.sql',
  'database-schema-luminarias.sql',
];

/**
 * Extrae información de CREATE TABLE de SQL
 */
function extractTables(sqlContent) {
  const tables = [];
  const tableRegex = /CREATE TABLE (\w+)\s*\(([\s\S]*?)\);/gi;
  let match;

  while ((match = tableRegex.exec(sqlContent)) !== null) {
    const tableName = match[1];
    const tableContent = match[2];

    const columns = extractColumns(tableContent);
    const constraints = extractTableConstraints(tableContent);

    tables.push({
      name: tableName,
      columns,
      constraints,
      fullDefinition: match[0],
    });
  }

  return tables;
}

/**
 * Extrae columnas de la definición de tabla
 */
function extractColumns(tableContent) {
  const columns = [];
  const lines = tableContent.split(',').map(l => l.trim());

  for (const line of lines) {
    // Skip constraints y líneas vacías
    if (
      !line ||
      line.toUpperCase().startsWith('PRIMARY KEY') ||
      line.toUpperCase().startsWith('FOREIGN KEY') ||
      line.toUpperCase().startsWith('UNIQUE') ||
      line.toUpperCase().startsWith('CHECK') ||
      line.toUpperCase().startsWith('CONSTRAINT')
    ) {
      continue;
    }

    // Parsear columna
    const columnMatch = line.match(/^(\w+)\s+([A-Z]+(?:\([^)]+\))?)(.*)?$/i);
    if (columnMatch) {
      const [, name, type, rest] = columnMatch;

      const isPrimary = rest && /PRIMARY KEY/i.test(rest);
      const isUnique = rest && /UNIQUE/i.test(rest);
      const isNotNull = rest && /NOT NULL/i.test(rest);
      const defaultMatch = rest && rest.match(/DEFAULT\s+([^,]+)/i);
      const referencesMatch = rest && rest.match(/REFERENCES\s+(\w+)\((\w+)\)(.*)?/i);

      columns.push({
        name,
        type,
        isPrimary,
        isUnique,
        isNotNull,
        default: defaultMatch ? defaultMatch[1].trim() : null,
        references: referencesMatch ? {
          table: referencesMatch[1],
          column: referencesMatch[2],
          onDelete: referencesMatch[3] && referencesMatch[3].match(/ON DELETE ([A-Z ]+)/i)?.[1],
          onUpdate: referencesMatch[3] && referencesMatch[3].match(/ON UPDATE ([A-Z ]+)/i)?.[1],
        } : null,
      });
    }
  }

  return columns;
}

/**
 * Extrae constraints de tabla
 */
function extractTableConstraints(tableContent) {
  const constraints = [];
  const lines = tableContent.split('\n').map(l => l.trim());

  for (const line of lines) {
    if (line.toUpperCase().includes('CONSTRAINT') ||
        line.toUpperCase().includes('UNIQUE(') ||
        line.toUpperCase().includes('CHECK(')) {
      constraints.push(line.replace(/,$/, ''));
    }
  }

  return constraints;
}

/**
 * Extrae índices del SQL
 */
function extractIndexes(sqlContent) {
  const indexes = [];
  const indexRegex = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\(([^)]+)\)/gi;
  let match;

  while ((match = indexRegex.exec(sqlContent)) !== null) {
    indexes.push({
      name: match[1],
      table: match[2],
      columns: match[3],
      definition: match[0],
    });
  }

  return indexes;
}

/**
 * Extrae triggers del SQL
 */
function extractTriggers(sqlContent) {
  const triggers = [];
  const triggerRegex = /CREATE TRIGGER\s+(\w+)([\s\S]*?)EXECUTE (?:FUNCTION|PROCEDURE)\s+(\w+\(\))/gi;
  let match;

  while ((match = triggerRegex.exec(sqlContent)) !== null) {
    triggers.push({
      name: match[1],
      definition: match[0],
      function: match[3],
    });
  }

  return triggers;
}

/**
 * Extrae funciones del SQL
 */
function extractFunctions(sqlContent) {
  const functions = [];
  const funcRegex = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+(\w+)\s*\((.*?)\)([\s\S]*?)\$\$\s*LANGUAGE\s+(\w+)/gi;
  let match;

  while ((match = funcRegex.exec(sqlContent)) !== null) {
    functions.push({
      name: match[1],
      parameters: match[2],
      language: match[4],
      definition: match[0],
    });
  }

  return functions;
}

/**
 * Extrae vistas del SQL
 */
function extractViews(sqlContent) {
  const views = [];
  const viewRegex = /CREATE\s+VIEW\s+(\w+)\s+AS([\s\S]*?)(?=CREATE|ALTER|INSERT|$)/gi;
  let match;

  while ((match = viewRegex.exec(sqlContent)) !== null) {
    views.push({
      name: match[1],
      definition: match[0].trim(),
    });
  }

  return views;
}

/**
 * Genera markdown para una tabla
 */
function generateTableMarkdown(table, indexes, triggers) {
  let md = `### Tabla: \`${table.name}\`\n\n`;

  // Columnas
  md += '#### Columnas\n\n';
  md += '| Nombre | Tipo | Nulable | Por Defecto | Descripción |\n';
  md += '|--------|------|---------|-------------|-------------|\n';

  table.columns.forEach(col => {
    const nullable = col.isNotNull ? '❌ No' : '✅ Sí';
    const defaultVal = col.default || '-';
    let description = '';

    if (col.isPrimary) description += 'PRIMARY KEY ';
    if (col.isUnique) description += 'UNIQUE ';
    if (col.references) {
      description += `FK → \`${col.references.table}.${col.references.column}\``;
      if (col.references.onDelete) description += ` ON DELETE ${col.references.onDelete}`;
    }

    md += `| \`${col.name}\` | ${col.type} | ${nullable} | \`${defaultVal}\` | ${description} |\n`;
  });

  md += '\n';

  // Constraints adicionales
  if (table.constraints.length > 0) {
    md += '#### Constraints\n\n';
    table.constraints.forEach(constraint => {
      md += `- ${constraint}\n`;
    });
    md += '\n';
  }

  // Índices de esta tabla
  const tableIndexes = indexes.filter(idx => idx.table === table.name);
  if (tableIndexes.length > 0) {
    md += '#### Índices\n\n';
    tableIndexes.forEach(idx => {
      md += `- \`${idx.name}\` en columnas: \`${idx.columns}\`\n`;
    });
    md += '\n';
  }

  // Triggers de esta tabla
  const tableTriggers = triggers.filter(trg =>
    trg.definition.toLowerCase().includes(`on ${table.name.toLowerCase()}`)
  );
  if (tableTriggers.length > 0) {
    md += '#### Triggers\n\n';
    tableTriggers.forEach(trg => {
      md += `- \`${trg.name}\` → ejecuta \`${trg.function}\`\n`;
    });
    md += '\n';
  }

  md += '---\n\n';

  return md;
}

/**
 * Función principal
 */
function generateDocumentation() {
  console.log('📚 Generando documentación del esquema de base de datos...\n');

  let allTables = [];
  let allIndexes = [];
  let allTriggers = [];
  let allFunctions = [];
  let allViews = [];

  // Leer todos los archivos de esquema
  for (const schemaFile of schemaFiles) {
    const filePath = path.join(projectRoot, schemaFile);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Archivo no encontrado: ${schemaFile}`);
      continue;
    }

    console.log(`📄 Procesando: ${schemaFile}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    // Extraer elementos
    const tables = extractTables(sqlContent);
    const indexes = extractIndexes(sqlContent);
    const triggers = extractTriggers(sqlContent);
    const functions = extractFunctions(sqlContent);
    const views = extractViews(sqlContent);

    console.log(`   ✓ ${tables.length} tablas, ${indexes.length} índices, ${triggers.length} triggers, ${functions.length} funciones, ${views.length} vistas`);

    allTables.push(...tables);
    allIndexes.push(...indexes);
    allTriggers.push(...triggers);
    allFunctions.push(...functions);
    allViews.push(...views);
  }

  // Eliminar duplicados (por nombre)
  allTables = [...new Map(allTables.map(t => [t.name, t])).values()];
  allIndexes = [...new Map(allIndexes.map(i => [i.name, i])).values()];
  allTriggers = [...new Map(allTriggers.map(t => [t.name, t])).values()];
  allFunctions = [...new Map(allFunctions.map(f => [f.name, f])).values()];
  allViews = [...new Map(allViews.map(v => [v.name, v])).values()];

  // Generar markdown
  let markdown = '# Documentación del Esquema de Base de Datos - PLAYTEST\n\n';
  markdown += `> Generado automáticamente el ${new Date().toLocaleString('es-ES')}\n\n`;
  markdown += '---\n\n';

  // Estadísticas
  markdown += '## Resumen\n\n';
  markdown += `- **Tablas**: ${allTables.length}\n`;
  markdown += `- **Índices**: ${allIndexes.length}\n`;
  markdown += `- **Triggers**: ${allTriggers.length}\n`;
  markdown += `- **Funciones**: ${allFunctions.length}\n`;
  markdown += `- **Vistas**: ${allViews.length}\n\n`;
  markdown += '---\n\n';

  // Tabla de contenidos
  markdown += '## Tabla de Contenidos\n\n';
  markdown += '### Tablas\n\n';
  allTables.sort((a, b) => a.name.localeCompare(b.name));
  allTables.forEach(table => {
    markdown += `- [${table.name}](#tabla-${table.name})\n`;
  });
  markdown += '\n';

  if (allViews.length > 0) {
    markdown += '### Vistas\n\n';
    allViews.sort((a, b) => a.name.localeCompare(b.name));
    allViews.forEach(view => {
      markdown += `- [${view.name}](#vista-${view.name})\n`;
    });
    markdown += '\n';
  }

  if (allFunctions.length > 0) {
    markdown += '### Funciones\n\n';
    allFunctions.sort((a, b) => a.name.localeCompare(b.name));
    allFunctions.forEach(func => {
      markdown += `- [${func.name}](#función-${func.name})\n`;
    });
    markdown += '\n';
  }

  markdown += '---\n\n';

  // Detalle de tablas
  markdown += '## Detalle de Tablas\n\n';
  allTables.forEach(table => {
    markdown += generateTableMarkdown(table, allIndexes, allTriggers);
  });

  // Vistas
  if (allViews.length > 0) {
    markdown += '## Vistas\n\n';
    allViews.forEach(view => {
      markdown += `### Vista: \`${view.name}\`\n\n`;
      markdown += '```sql\n';
      markdown += view.definition;
      markdown += '\n```\n\n';
      markdown += '---\n\n';
    });
  }

  // Funciones
  if (allFunctions.length > 0) {
    markdown += '## Funciones y Procedimientos\n\n';
    allFunctions.forEach(func => {
      markdown += `### Función: \`${func.name}\`\n\n`;
      if (func.parameters) {
        markdown += `**Parámetros**: \`${func.parameters}\`\n\n`;
      }
      markdown += `**Lenguaje**: ${func.language}\n\n`;
      markdown += '<details>\n<summary>Ver definición completa</summary>\n\n';
      markdown += '```sql\n';
      markdown += func.definition;
      markdown += '\n```\n';
      markdown += '</details>\n\n';
      markdown += '---\n\n';
    });
  }

  // Diagrama de relaciones (texto)
  markdown += '## Diagrama de Relaciones\n\n';
  markdown += '### Foreign Keys (Relaciones entre tablas)\n\n';
  markdown += '```\n';
  allTables.forEach(table => {
    const fks = table.columns.filter(col => col.references);
    if (fks.length > 0) {
      fks.forEach(fk => {
        markdown += `${table.name}.${fk.name} -> ${fk.references.table}.${fk.references.column}`;
        if (fk.references.onDelete) markdown += ` [ON DELETE ${fk.references.onDelete}]`;
        markdown += '\n';
      });
    }
  });
  markdown += '```\n\n';

  // Guardar archivo
  console.log(`\n💾 Guardando documentación en: ${outputFile}`);
  fs.writeFileSync(outputFile, markdown, 'utf8');

  console.log('\n✅ ¡Documentación generada exitosamente!\n');
  console.log(`📄 Archivo: ${outputFile}`);
  console.log(`📊 Total elementos documentados:`);
  console.log(`   - Tablas: ${allTables.length}`);
  console.log(`   - Índices: ${allIndexes.length}`);
  console.log(`   - Triggers: ${allTriggers.length}`);
  console.log(`   - Funciones: ${allFunctions.length}`);
  console.log(`   - Vistas: ${allViews.length}`);
}

// Ejecutar
try {
  generateDocumentation();
  console.log('\n🎉 Proceso completado exitosamente');
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error:', error);
  process.exit(1);
}

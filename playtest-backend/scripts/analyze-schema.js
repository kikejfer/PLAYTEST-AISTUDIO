#!/usr/bin/env node

/**
 * Script para analizar el esquema de base de datos y proporcionar recomendaciones
 * de mejora sin necesidad de crear nuevas tablas
 *
 * Uso: node analyze-schema.js
 */

const { pool } = require('../database/connection');

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const BLUE = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

/**
 * Analiza índices faltantes basándose en foreign keys
 */
async function analyzeIndexes() {
  console.log(`\n${BOLD}${BLUE}📊 Analizando índices...${RESET}\n`);

  const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name;
  `;

  const result = await pool.query(query);
  const foreignKeys = result.rows;

  console.log(`${GREEN}✓${RESET} Encontradas ${foreignKeys.length} foreign keys\n`);

  // Verificar si cada FK tiene un índice
  const recommendations = [];

  for (const fk of foreignKeys) {
    const indexQuery = `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = $1
        AND indexdef LIKE '%' || $2 || '%'
    `;

    const indexResult = await pool.query(indexQuery, [fk.table_name, fk.column_name]);

    if (indexResult.rows.length === 0) {
      recommendations.push({
        type: 'missing_index',
        table: fk.table_name,
        column: fk.column_name,
        reason: `FK a ${fk.foreign_table_name}.${fk.foreign_column_name} sin índice`,
        suggestion: `CREATE INDEX idx_${fk.table_name}_${fk.column_name} ON ${fk.table_name}(${fk.column_name});`
      });
    }
  }

  if (recommendations.length > 0) {
    console.log(`${YELLOW}⚠️  Se encontraron ${recommendations.length} foreign keys sin índices:${RESET}\n`);
    recommendations.forEach(rec => {
      console.log(`  ${RED}✗${RESET} ${rec.table}.${rec.column}`);
      console.log(`    Razón: ${rec.reason}`);
      console.log(`    ${BLUE}Sugerencia:${RESET} ${rec.suggestion}\n`);
    });
  } else {
    console.log(`${GREEN}✓${RESET} Todas las foreign keys tienen índices\n`);
  }

  return recommendations;
}

/**
 * Analiza columnas con nombres comunes que podrían necesitar índices
 */
async function analyzeCommonColumns() {
  console.log(`\n${BOLD}${BLUE}🔍 Analizando columnas comunes...${RESET}\n`);

  const commonColumns = ['email', 'created_at', 'updated_at', 'status', 'type', 'created_by'];
  const recommendations = [];

  for (const colName of commonColumns) {
    const query = `
      SELECT
        table_name,
        column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = $1
    `;

    const result = await pool.query(query, [colName]);

    for (const row of result.rows) {
      // Verificar si tiene índice
      const indexQuery = `
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = $1
          AND indexdef LIKE '%' || $2 || '%'
      `;

      const indexResult = await pool.query(indexQuery, [row.table_name, row.column_name]);

      if (indexResult.rows.length === 0) {
        recommendations.push({
          type: 'common_column_no_index',
          table: row.table_name,
          column: row.column_name,
          reason: `Columna común '${colName}' probablemente usada en filtros/búsquedas`,
          suggestion: `CREATE INDEX idx_${row.table_name}_${row.column_name} ON ${row.table_name}(${row.column_name});`
        });
      }
    }
  }

  if (recommendations.length > 0) {
    console.log(`${YELLOW}💡 Se encontraron ${recommendations.length} columnas comunes sin índices:${RESET}\n`);
    recommendations.forEach(rec => {
      console.log(`  ${YELLOW}!${RESET} ${rec.table}.${rec.column}`);
      console.log(`    Razón: ${rec.reason}`);
      console.log(`    ${BLUE}Sugerencia:${RESET} ${rec.suggestion}\n`);
    });
  } else {
    console.log(`${GREEN}✓${RESET} Todas las columnas comunes tienen índices apropiados\n`);
  }

  return recommendations;
}

/**
 * Analiza tablas sin timestamps
 */
async function analyzeTimestamps() {
  console.log(`\n${BOLD}${BLUE}⏰ Analizando timestamps...${RESET}\n`);

  const query = `
    SELECT DISTINCT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `;

  const result = await pool.query(query);
  const recommendations = [];

  for (const row of result.rows) {
    // Verificar si tiene created_at o updated_at
    const colQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name IN ('created_at', 'updated_at')
    `;

    const colResult = await pool.query(colQuery, [row.table_name]);
    const columns = colResult.rows.map(r => r.column_name);

    if (!columns.includes('created_at')) {
      recommendations.push({
        type: 'missing_timestamp',
        table: row.table_name,
        column: 'created_at',
        reason: 'Útil para auditoría y troubleshooting',
        suggestion: `ALTER TABLE ${row.table_name} ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`
      });
    }

    if (!columns.includes('updated_at')) {
      recommendations.push({
        type: 'missing_timestamp',
        table: row.table_name,
        column: 'updated_at',
        reason: 'Útil para auditoría y sincronización',
        suggestion: `ALTER TABLE ${row.table_name} ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`
      });
    }
  }

  if (recommendations.length > 0) {
    console.log(`${YELLOW}📅 Se encontraron ${recommendations.length} tablas sin timestamps completos:${RESET}\n`);
    recommendations.forEach(rec => {
      console.log(`  ${YELLOW}!${RESET} ${rec.table} - falta ${rec.column}`);
      console.log(`    Razón: ${rec.reason}`);
      console.log(`    ${BLUE}Sugerencia:${RESET} ${rec.suggestion}\n`);
    });
  } else {
    console.log(`${GREEN}✓${RESET} Todas las tablas tienen timestamps apropiados\n`);
  }

  return recommendations;
}

/**
 * Analiza tablas sin soft delete
 */
async function analyzeSoftDelete() {
  console.log(`\n${BOLD}${BLUE}🗑️  Analizando soft delete...${RESET}\n`);

  const query = `
    SELECT DISTINCT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `;

  const result = await pool.query(query);
  const recommendations = [];

  for (const row of result.rows) {
    // Verificar si tiene deleted_at o similar
    const colQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name IN ('deleted_at', 'is_deleted', 'deleted')
    `;

    const colResult = await pool.query(colQuery, [row.table_name]);

    if (colResult.rows.length === 0) {
      // Solo recomendar para tablas principales (no de unión)
      if (!row.table_name.includes('_') || ['user_profiles', 'user_sessions'].includes(row.table_name)) {
        recommendations.push({
          type: 'missing_soft_delete',
          table: row.table_name,
          reason: 'Permite recuperar datos eliminados accidentalmente',
          suggestion: `ALTER TABLE ${row.table_name} ADD COLUMN deleted_at TIMESTAMP NULL;
CREATE INDEX idx_${row.table_name}_deleted_at ON ${row.table_name}(deleted_at) WHERE deleted_at IS NULL;`
        });
      }
    }
  }

  if (recommendations.length > 0) {
    console.log(`${YELLOW}💡 ${recommendations.length} tablas podrían beneficiarse de soft delete:${RESET}\n`);
    recommendations.forEach(rec => {
      console.log(`  ${YELLOW}!${RESET} ${rec.table}`);
      console.log(`    Razón: ${rec.reason}`);
      console.log(`    ${BLUE}Sugerencia:${RESET}\n${rec.suggestion}\n`);
    });
  } else {
    console.log(`${GREEN}✓${RESET} Las tablas principales tienen soft delete implementado\n`);
  }

  return recommendations;
}

/**
 * Analiza cardinalidad de índices
 */
async function analyzeIndexCardinality() {
  console.log(`\n${BOLD}${BLUE}📈 Analizando cardinalidad de índices...${RESET}\n`);

  const query = `
    SELECT
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
    ORDER BY idx_scan ASC
    LIMIT 10;
  `;

  const result = await pool.query(query);
  const recommendations = [];

  console.log(`${BLUE}Índices menos utilizados (candidatos para revisión):${RESET}\n`);

  result.rows.forEach(row => {
    if (row.index_scans === 0 && !row.indexname.includes('_pkey')) {
      console.log(`  ${YELLOW}⚠️${RESET} ${row.tablename}.${row.indexname}`);
      console.log(`    Scans: ${row.index_scans} | Tuplas leídas: ${row.tuples_read}`);

      recommendations.push({
        type: 'unused_index',
        table: row.tablename,
        index: row.indexname,
        reason: `Índice nunca usado (0 scans)`,
        suggestion: `-- Considera eliminar si no es necesario:\nDROP INDEX ${row.indexname};`
      });
    }
  });

  if (recommendations.length === 0) {
    console.log(`${GREEN}✓${RESET} Todos los índices se están usando\n`);
  } else {
    console.log(`\n${YELLOW}💡 ${recommendations.length} índices podrían no ser necesarios${RESET}\n`);
  }

  return recommendations;
}

/**
 * Genera reporte de tamaño de tablas
 */
async function analyzeTableSizes() {
  console.log(`\n${BOLD}${BLUE}💾 Analizando tamaño de tablas...${RESET}\n`);

  const query = `
    SELECT
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
      pg_total_relation_size(schemaname||'.'||tablename) AS raw_size
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY raw_size DESC
    LIMIT 10;
  `;

  const result = await pool.query(query);

  console.log(`${BLUE}Top 10 tablas por tamaño:${RESET}\n`);

  result.rows.forEach((row, idx) => {
    const emoji = idx === 0 ? '👑' : idx < 3 ? '📊' : '📁';
    console.log(`  ${emoji} ${row.tablename.padEnd(30)} ${row.size}`);
  });

  console.log('');
  return [];
}

/**
 * Genera reporte completo
 */
async function generateReport() {
  console.log(`\n${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${GREEN}║   Análisis de Esquema de Base de Datos - PLAYTEST        ║${RESET}`);
  console.log(`${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${RESET}`);

  const allRecommendations = [];

  try {
    // Ejecutar todos los análisis
    const indexRecs = await analyzeIndexes();
    allRecommendations.push(...indexRecs);

    const commonColRecs = await analyzeCommonColumns();
    allRecommendations.push(...commonColRecs);

    const timestampRecs = await analyzeTimestamps();
    allRecommendations.push(...timestampRecs);

    const softDeleteRecs = await analyzeSoftDelete();
    allRecommendations.push(...softDeleteRecs);

    const cardinalityRecs = await analyzeIndexCardinality();
    allRecommendations.push(...cardinalityRecs);

    await analyzeTableSizes();

    // Resumen final
    console.log(`\n${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${BOLD}${GREEN}║                      RESUMEN                               ║${RESET}`);
    console.log(`${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${RESET}\n`);

    console.log(`Total de recomendaciones: ${allRecommendations.length}\n`);

    const byType = allRecommendations.reduce((acc, rec) => {
      acc[rec.type] = (acc[rec.type] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  • ${type}: ${count}`);
    });

    if (allRecommendations.length === 0) {
      console.log(`\n${GREEN}${BOLD}✅ ¡Tu esquema está bien optimizado!${RESET}\n`);
    } else {
      console.log(`\n${YELLOW}💡 Revisa las sugerencias arriba para mejorar tu esquema${RESET}\n`);
    }

  } catch (error) {
    console.error(`\n${RED}❌ Error durante el análisis:${RESET}`, error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar
generateReport()
  .then(() => {
    console.log(`${GREEN}✅ Análisis completado${RESET}\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${RED}💥 Error fatal:${RESET}`, error);
    process.exit(1);
  });

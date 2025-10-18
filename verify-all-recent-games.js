/**
 * VERIFICACIÓN BATCH DE PARTIDAS RECIENTES
 *
 * Uso:
 *   node verify-all-recent-games.js [limit] [hours]
 *
 * Parámetros:
 *   limit: Número máximo de partidas a verificar (default: 10)
 *   hours: Horas hacia atrás para buscar partidas (default: 24)
 *
 * Ejemplo:
 *   node verify-all-recent-games.js 20 48
 *   (Verifica las últimas 20 partidas de las últimas 48 horas)
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'lumiquiz-db-enferlo-lumiquiz.d.aivencloud.com',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 24407,
  database: process.env.DB_NAME || 'defaultdb',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getRecentGames(limit = 10, hours = 24) {
  const query = `
    SELECT
      g.id,
      g.game_type,
      g.status,
      g.created_by,
      g.created_at,
      u.nickname as creator_nickname
    FROM games g
    LEFT JOIN users u ON g.created_by = u.id
    WHERE g.created_at >= NOW() - INTERVAL '${hours} hours'
    ORDER BY g.created_at DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
}

async function quickVerify(gameId) {
  const checks = {
    hasPlayers: false,
    hasScores: false,
    statusCompleted: false,
    errors: []
  };

  try {
    // Check game status
    const gameResult = await pool.query(
      'SELECT status FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      checks.errors.push('Game not found');
      return checks;
    }

    checks.statusCompleted = gameResult.rows[0].status === 'completed';

    // Check players
    const playersResult = await pool.query(
      'SELECT COUNT(*) as count FROM game_players WHERE game_id = $1',
      [gameId]
    );
    checks.hasPlayers = parseInt(playersResult.rows[0].count) > 0;

    // Check scores
    const scoresResult = await pool.query(
      'SELECT COUNT(*) as count FROM game_scores WHERE game_id = $1',
      [gameId]
    );
    checks.hasScores = parseInt(scoresResult.rows[0].count) > 0;

  } catch (error) {
    checks.errors.push(error.message);
  }

  return checks;
}

function getStatusIcon(checks) {
  if (checks.errors.length > 0) return '❌';
  if (checks.hasPlayers && checks.hasScores && checks.statusCompleted) return '✅';
  if (checks.hasPlayers && checks.hasScores) return '⚠️';
  return '❌';
}

async function main() {
  const limit = parseInt(process.argv[2]) || 10;
  const hours = parseInt(process.argv[3]) || 24;

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log('🔍 VERIFICACIÓN BATCH DE PARTIDAS RECIENTES', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  log(`📊 Parámetros:`, 'blue');
  log(`   - Límite: ${limit} partidas`, 'blue');
  log(`   - Rango: Últimas ${hours} horas\n`, 'blue');

  try {
    // Obtener partidas recientes
    log('🔎 Buscando partidas...', 'yellow');
    const games = await getRecentGames(limit, hours);

    if (games.length === 0) {
      log(`\n⚠️  No se encontraron partidas en las últimas ${hours} horas`, 'yellow');
      return;
    }

    log(`✅ Encontradas ${games.length} partidas\n`, 'green');

    // Tabla de resultados
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log(' ID  | Tipo          | Estado      | Jugador        | Players | Scores | Status', 'cyan');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');

    let stats = {
      total: games.length,
      completed: 0,
      withPlayers: 0,
      withScores: 0,
      fullyValid: 0,
      errors: 0
    };

    for (const game of games) {
      const checks = await quickVerify(game.id);
      const icon = getStatusIcon(checks);

      // Formatear campos
      const id = String(game.id).padEnd(4);
      const type = String(game.game_type).padEnd(14);
      const status = String(game.status).padEnd(12);
      const creator = String(game.creator_nickname || 'Unknown').padEnd(15);
      const hasPlayers = checks.hasPlayers ? '✓' : '✗';
      const hasScores = checks.hasScores ? '✓' : '✗';

      // Determinar color de la línea
      let lineColor = 'reset';
      if (icon === '✅') lineColor = 'green';
      else if (icon === '⚠️') lineColor = 'yellow';
      else if (icon === '❌') lineColor = 'red';

      log(
        ` ${id} | ${type} | ${status} | ${creator} |    ${hasPlayers}    |   ${hasScores}    | ${icon}`,
        lineColor
      );

      // Actualizar estadísticas
      if (checks.statusCompleted) stats.completed++;
      if (checks.hasPlayers) stats.withPlayers++;
      if (checks.hasScores) stats.withScores++;
      if (checks.hasPlayers && checks.hasScores && checks.statusCompleted) stats.fullyValid++;
      if (checks.errors.length > 0) stats.errors++;
    }

    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

    // Resumen estadístico
    log('📊 RESUMEN ESTADÍSTICO:', 'blue');
    log(`   Total partidas:        ${stats.total}`, 'blue');
    log(`   Completadas:           ${stats.completed} (${Math.round(stats.completed/stats.total*100)}%)`, 'blue');
    log(`   Con jugadores:         ${stats.withPlayers} (${Math.round(stats.withPlayers/stats.total*100)}%)`, 'blue');
    log(`   Con scores:            ${stats.withScores} (${Math.round(stats.withScores/stats.total*100)}%)`, 'blue');
    log(`   ✅ Totalmente válidas: ${stats.fullyValid} (${Math.round(stats.fullyValid/stats.total*100)}%)`, 'green');

    if (stats.errors > 0) {
      log(`   ❌ Con errores:        ${stats.errors}`, 'red');
    }

    log('\n📋 MODALIDADES TESTEADAS:', 'blue');
    const modalityCounts = {};
    games.forEach(g => {
      modalityCounts[g.game_type] = (modalityCounts[g.game_type] || 0) + 1;
    });

    Object.entries(modalityCounts).forEach(([type, count]) => {
      log(`   ${type.padEnd(15)}: ${count} partida(s)`, 'cyan');
    });

    // Conclusión
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    const successRate = Math.round(stats.fullyValid / stats.total * 100);
    if (successRate === 100) {
      log('✅ EXCELENTE: Todas las partidas guardaron datos correctamente', 'green');
    } else if (successRate >= 80) {
      log('⚠️  BUENO: La mayoría de partidas funcionan, pero hay algunas con problemas', 'yellow');
    } else if (successRate >= 50) {
      log('⚠️  REGULAR: Aproximadamente la mitad de las partidas tienen problemas', 'yellow');
    } else {
      log('❌ CRÍTICO: La mayoría de partidas NO están guardando datos correctamente', 'red');
    }
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

    // Recomendaciones
    if (stats.fullyValid < stats.total) {
      log('💡 RECOMENDACIONES:', 'yellow');

      if (stats.withPlayers < stats.total) {
        log('   - Algunas partidas no tienen jugadores registrados en game_players', 'yellow');
        log('     → Verifica que el endpoint POST /api/games crea el registro', 'yellow');
      }

      if (stats.withScores < stats.total) {
        log('   - Algunas partidas no tienen scores registrados en game_scores', 'yellow');
        log('     → Verifica que el endpoint POST /api/games/:id/scores funciona', 'yellow');
      }

      if (stats.completed < stats.total) {
        log('   - Algunas partidas no están marcadas como "completed"', 'yellow');
        log('     → Verifica que el juego actualiza el status al finalizar', 'yellow');
      }

      log('\n   Para ver detalles de una partida específica:', 'blue');
      log('   → node verify-game-data.js <game_id> <user_id>\n', 'blue');
    }

  } catch (error) {
    log('\n❌ ERROR:', 'red');
    log(error.message, 'red');
    console.error(error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

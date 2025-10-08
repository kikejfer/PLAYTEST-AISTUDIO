/**
 * SCRIPT DE VERIFICACIÓN AUTOMÁTICA DE PARTIDAS
 *
 * Uso:
 *   node verify-game-data.js <game_id> [user_id]
 *
 * Ejemplo:
 *   node verify-game-data.js 123 45
 *
 * Este script verifica automáticamente que una partida guardó datos correctamente
 * en todas las tablas relevantes.
 */

const { Pool } = require('pg');

// Configuración de conexión a PostgreSQL (Aiven)
// IMPORTANTE: Configura estas variables de entorno antes de ejecutar
const pool = new Pool({
  host: process.env.DB_HOST || 'tu-host.aiven.com',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'playtest',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logCheck(passed, message) {
  const symbol = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${symbol} ${message}`, color);
  return passed;
}

// Validar estructura de JSONB
function validateScoreData(scoreData) {
  const required = ['score', 'totalAnswered', 'correct', 'incorrect'];
  const missing = required.filter(field => !(field in scoreData));

  if (missing.length > 0) {
    log(`   ⚠️  Campos faltantes en score_data: ${missing.join(', ')}`, 'yellow');
    return false;
  }
  return true;
}

function validateStats(stats) {
  if (!stats || typeof stats !== 'object') {
    log('   ⚠️  stats no es un objeto válido', 'yellow');
    return false;
  }

  // Opcional pero recomendado
  if (!stats.consolidation) {
    log('   ℹ️  stats.consolidation no existe (opcional)', 'blue');
  }
  if (typeof stats.totalGames !== 'number') {
    log('   ℹ️  stats.totalGames no es un número (opcional)', 'blue');
  }

  return true;
}

async function verifyGame(gameId, userId = null) {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`🔍 VERIFICACIÓN DE PARTIDA: ID ${gameId}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  let allPassed = true;

  try {
    // ========================================
    // 1. VERIFICAR TABLA GAMES
    // ========================================
    log('📊 1. Verificando tabla GAMES...', 'blue');

    const gameResult = await pool.query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      logCheck(false, 'Partida NO existe en tabla games');
      log('\n❌ ERROR CRÍTICO: La partida no existe. Abortando verificación.\n', 'red');
      return false;
    }

    const game = gameResult.rows[0];
    logCheck(true, 'Partida existe en tabla games');

    allPassed &= logCheck(
      game.game_type && typeof game.game_type === 'string',
      `Campo game_type: "${game.game_type}"`
    );

    allPassed &= logCheck(
      game.created_by && typeof game.created_by === 'number',
      `Campo created_by: ${game.created_by}`
    );

    allPassed &= logCheck(
      ['pending', 'in_progress', 'completed', 'cancelled'].includes(game.status),
      `Campo status: "${game.status}"`
    );

    allPassed &= logCheck(
      game.config && typeof game.config === 'object',
      `Campo config (JSONB): ${Object.keys(game.config).length} keys`
    );

    allPassed &= logCheck(
      game.game_state && typeof game.game_state === 'object',
      `Campo game_state (JSONB): ${Object.keys(game.game_state).length} keys`
    );

    log(`   📝 Config: ${JSON.stringify(game.config).substring(0, 100)}...`, 'blue');

    // ========================================
    // 2. VERIFICAR TABLA GAME_PLAYERS
    // ========================================
    log('\n👥 2. Verificando tabla GAME_PLAYERS...', 'blue');

    const playersResult = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1',
      [gameId]
    );

    if (playersResult.rows.length === 0) {
      allPassed &= logCheck(false, 'NO hay jugadores registrados en game_players');
    } else {
      logCheck(true, `${playersResult.rows.length} jugador(es) registrado(s)`);

      playersResult.rows.forEach((player, index) => {
        log(`   👤 Jugador ${index + 1}:`, 'cyan');
        allPassed &= logCheck(
          player.user_id && typeof player.user_id === 'number',
          `   - user_id: ${player.user_id}`
        );
        allPassed &= logCheck(
          typeof player.player_index === 'number',
          `   - player_index: ${player.player_index}`
        );
        allPassed &= logCheck(
          player.nickname && player.nickname.length > 0,
          `   - nickname: "${player.nickname}"`
        );
      });
    }

    // ========================================
    // 3. VERIFICAR TABLA GAME_SCORES
    // ========================================
    log('\n🏆 3. Verificando tabla GAME_SCORES...', 'blue');

    const scoresResult = await pool.query(
      'SELECT * FROM game_scores WHERE game_id = $1',
      [gameId]
    );

    if (scoresResult.rows.length === 0) {
      allPassed &= logCheck(false, 'NO hay scores registrados en game_scores');
    } else {
      logCheck(true, `${scoresResult.rows.length} score(s) registrado(s)`);

      scoresResult.rows.forEach((score, index) => {
        log(`   🎯 Score ${index + 1}:`, 'cyan');
        allPassed &= logCheck(
          score.game_type === game.game_type,
          `   - game_type coincide: "${score.game_type}"`
        );
        allPassed &= logCheck(
          score.score_data && typeof score.score_data === 'object',
          `   - score_data es JSONB válido`
        );

        if (score.score_data) {
          const valid = validateScoreData(score.score_data);
          allPassed &= valid;
          log(`   - score: ${score.score_data.score}`, 'blue');
          log(`   - correct: ${score.score_data.correct}`, 'blue');
          log(`   - incorrect: ${score.score_data.incorrect}`, 'blue');
        }
      });
    }

    // ========================================
    // 4. VERIFICAR USER_PROFILES (si se proporciona user_id)
    // ========================================
    if (userId) {
      log('\n📈 4. Verificando tabla USER_PROFILES...', 'blue');

      const profileResult = await pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [userId]
      );

      if (profileResult.rows.length === 0) {
        allPassed &= logCheck(false, 'Perfil de usuario NO existe');
      } else {
        const profile = profileResult.rows[0];
        logCheck(true, 'Perfil de usuario existe');

        allPassed &= logCheck(
          Array.isArray(profile.answer_history),
          `answer_history es array: ${profile.answer_history.length} respuestas`
        );

        allPassed &= logCheck(
          profile.stats && typeof profile.stats === 'object',
          `stats es JSONB válido`
        );

        if (profile.stats) {
          validateStats(profile.stats);
          log(`   📊 totalGames: ${profile.stats.totalGames || 'N/A'}`, 'blue');
          log(`   📊 totalScore: ${profile.stats.totalScore || 'N/A'}`, 'blue');
        }
      }
    } else {
      log('\n⏭️  4. Verificación de USER_PROFILES omitida (user_id no proporcionado)', 'yellow');
    }

    // ========================================
    // 5. VERIFICAR USER_GAME_CONFIGURATIONS
    // ========================================
    if (userId) {
      log('\n⚙️  5. Verificando tabla USER_GAME_CONFIGURATIONS...', 'blue');

      const configResult = await pool.query(
        `SELECT * FROM user_game_configurations
         WHERE user_id = $1 AND game_type = $2
         ORDER BY last_used DESC LIMIT 1`,
        [userId, game.game_type]
      );

      if (configResult.rows.length === 0) {
        log('   ℹ️  No hay configuración guardada (opcional)', 'yellow');
      } else {
        const config = configResult.rows[0];
        logCheck(true, 'Configuración guardada encontrada');
        log(`   - game_type: "${config.game_type}"`, 'blue');
        log(`   - use_count: ${config.use_count}`, 'blue');
        log(`   - last_used: ${config.last_used}`, 'blue');
      }
    }

    // ========================================
    // RESUMEN FINAL
    // ========================================
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    if (allPassed) {
      log('✅ VERIFICACIÓN EXITOSA - Todos los checks pasaron', 'green');
    } else {
      log('⚠️  VERIFICACIÓN CON ERRORES - Revisa los checks marcados con ❌', 'yellow');
    }
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

    return allPassed;

  } catch (error) {
    log('\n❌ ERROR EN VERIFICACIÓN:', 'red');
    log(error.message, 'red');
    log(error.stack, 'red');
    return false;
  }
}

// ========================================
// MAIN - Ejecución del script
// ========================================
async function main() {
  const gameId = parseInt(process.argv[2]);
  const userId = process.argv[3] ? parseInt(process.argv[3]) : null;

  if (!gameId || isNaN(gameId)) {
    log('❌ ERROR: Debes proporcionar un game_id válido', 'red');
    log('\nUso:', 'yellow');
    log('  node verify-game-data.js <game_id> [user_id]', 'yellow');
    log('\nEjemplo:', 'yellow');
    log('  node verify-game-data.js 123 45', 'yellow');
    log('\nVariables de entorno requeridas:', 'yellow');
    log('  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD\n', 'yellow');
    process.exit(1);
  }

  if (!process.env.DB_PASSWORD) {
    log('⚠️  ADVERTENCIA: DB_PASSWORD no está configurada', 'yellow');
    log('   Configura las variables de entorno antes de ejecutar\n', 'yellow');
  }

  try {
    const success = await verifyGame(gameId, userId);
    process.exit(success ? 0 : 1);
  } catch (error) {
    log(`\n❌ Error fatal: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { verifyGame };

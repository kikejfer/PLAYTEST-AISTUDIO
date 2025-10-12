/**
 * Script de Verificación Automática de Guardado de Modalidades
 * ETAPA 1.3 - Plan Maestro PLAYTEST
 *
 * Este script verifica que todas las modalidades están guardando datos correctamente
 * en la base de datos después de que Comet juegue manualmente cada modalidad.
 *
 * Usuario de prueba: JaiGon (ID aproximado a buscar)
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 24407,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
});

if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
  console.error('❌ Error: DB_HOST y DB_PASSWORD deben estar definidos en .env');
  console.error('Crea un archivo .env con:');
  console.error('DB_HOST=tu_host');
  console.error('DB_PORT=24407');
  console.error('DB_NAME=defaultdb');
  console.error('DB_USER=avnadmin');
  console.error('DB_PASSWORD=tu_password');
  process.exit(1);
}

const GAME_MODES = [
  'classic',
  'streak',
  'by-levels',
  'exam',
  'lives',
  'time-trial',
  'marathon',
  'duel',
  'trivial'
];

const GAME_MODE_DISPLAY = {
  'classic': 'Clásico',
  'streak': 'Racha',
  'by-levels': 'Por Niveles',
  'exam': 'Examen',
  'lives': 'Vidas',
  'time-trial': 'Contrarreloj',
  'marathon': 'Maratón',
  'duel': 'Duelo',
  'trivial': 'Trivial'
};

async function findUserByNickname(nickname) {
  try {
    const result = await pool.query(
      'SELECT id, nickname, email FROM users WHERE nickname = $1',
      [nickname]
    );

    if (result.rows.length === 0) {
      console.log(`❌ Usuario '${nickname}' no encontrado`);
      return null;
    }

    const user = result.rows[0];
    console.log(`✅ Usuario encontrado: ${user.nickname} (ID: ${user.id})`);
    return user;
  } catch (error) {
    console.error('Error buscando usuario:', error.message);
    return null;
  }
}

async function getRecentGamesForUser(userId, limit = 20) {
  try {
    const result = await pool.query(`
      SELECT
        g.id,
        g.game_type,
        g.status,
        g.created_at,
        g.config,
        EXISTS(SELECT 1 FROM game_scores WHERE game_id = g.id) as has_score,
        EXISTS(SELECT 1 FROM game_players WHERE game_id = g.id AND user_id = $1) as is_player
      FROM games g
      WHERE EXISTS(
        SELECT 1 FROM game_players gp
        WHERE gp.game_id = g.id AND gp.user_id = $1
      )
      ORDER BY g.created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  } catch (error) {
    console.error('Error obteniendo partidas:', error.message);
    return [];
  }
}

async function getGameDetails(gameId) {
  try {
    // Get game info
    const gameResult = await pool.query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );

    if (gameResult.rows.length === 0) {
      return null;
    }

    const game = gameResult.rows[0];

    // Get players
    const playersResult = await pool.query(
      'SELECT * FROM game_players WHERE game_id = $1',
      [gameId]
    );

    // Get scores
    const scoresResult = await pool.query(
      'SELECT * FROM game_scores WHERE game_id = $1',
      [gameId]
    );

    return {
      game: game,
      players: playersResult.rows,
      scores: scoresResult.rows
    };
  } catch (error) {
    console.error('Error obteniendo detalles:', error.message);
    return null;
  }
}

async function checkUserProfileUpdates(userId) {
  try {
    const result = await pool.query(`
      SELECT
        u.nickname,
        up.answer_history,
        jsonb_array_length(up.answer_history) as num_respuestas,
        up.stats
      FROM users u
      JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error verificando perfil:', error.message);
    return null;
  }
}

async function analyzeGameMode(userId, gameType) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎮 MODALIDAD: ${GAME_MODE_DISPLAY[gameType] || gameType}`);
  console.log('='.repeat(70));

  try {
    // Find most recent game of this type
    const result = await pool.query(`
      SELECT g.id, g.created_at, g.status
      FROM games g
      JOIN game_players gp ON g.id = gp.game_id
      WHERE gp.user_id = $1
        AND g.game_type = $2
      ORDER BY g.created_at DESC
      LIMIT 1
    `, [userId, gameType]);

    if (result.rows.length === 0) {
      console.log(`❌ NO SE ENCONTRÓ ninguna partida de tipo '${gameType}'`);
      console.log(`   Usuario no ha jugado esta modalidad todavía.`);
      return {
        mode: gameType,
        status: '❓ NO TESTEADO',
        issues: ['No se encontró partida de este tipo'],
        priority: 'ALTA'
      };
    }

    const lastGame = result.rows[0];
    console.log(`\n✅ Última partida encontrada:`);
    console.log(`   ID: ${lastGame.id}`);
    console.log(`   Fecha: ${lastGame.created_at}`);
    console.log(`   Estado: ${lastGame.status}`);

    // Get full details
    const details = await getGameDetails(lastGame.id);

    if (!details) {
      console.log(`❌ No se pudieron obtener detalles de la partida`);
      return {
        mode: gameType,
        status: '❌ ERROR',
        issues: ['Error al obtener detalles'],
        priority: 'CRÍTICA'
      };
    }

    // Check completeness
    const checks = {
      gameExists: !!details.game,
      isCompleted: details.game.status === 'completed',
      hasPlayers: details.players.length > 0,
      hasScores: details.scores.length > 0,
      scoreDataValid: details.scores.length > 0 && !!details.scores[0].score_data
    };

    console.log(`\n📊 Verificaciones:`);
    console.log(`   ${checks.gameExists ? '✅' : '❌'} Partida existe en BD`);
    console.log(`   ${checks.isCompleted ? '✅' : '❌'} Estado = 'completed'`);
    console.log(`   ${checks.hasPlayers ? '✅' : '❌'} Tiene jugadores registrados (${details.players.length})`);
    console.log(`   ${checks.hasScores ? '✅' : '❌'} Tiene scores registrados (${details.scores.length})`);
    console.log(`   ${checks.scoreDataValid ? '✅' : '❌'} score_data es válido`);

    // Show score data if exists
    if (checks.scoreDataValid) {
      const scoreData = details.scores[0].score_data;
      console.log(`\n🎯 Datos de puntuación:`);
      console.log(`   Score: ${scoreData.score || 'N/A'}`);
      console.log(`   Correctas: ${scoreData.correct || 0}`);
      console.log(`   Incorrectas: ${scoreData.incorrect || 0}`);
      console.log(`   En blanco: ${scoreData.blank || 0}`);
      console.log(`   Total preguntas: ${scoreData.totalQuestions || scoreData.total || 'N/A'}`);
    }

    // Determine status
    const allChecksPass = Object.values(checks).every(v => v === true);
    const someChecksFail = Object.values(checks).some(v => v === false);

    let status, issues = [], priority;

    if (allChecksPass) {
      status = '✅ FUNCIONAL';
      priority = 'NINGUNA';
    } else if (checks.gameExists && checks.hasPlayers) {
      status = '⚠️ PARCIAL';
      issues = Object.entries(checks)
        .filter(([k, v]) => !v)
        .map(([k]) => k);
      priority = 'MEDIA';
    } else {
      status = '❌ ROTO';
      issues = Object.entries(checks)
        .filter(([k, v]) => !v)
        .map(([k]) => k);
      priority = 'CRÍTICA';
    }

    console.log(`\n🏷️  RESULTADO: ${status}`);
    if (issues.length > 0) {
      console.log(`⚠️  Issues: ${issues.join(', ')}`);
    }

    return {
      mode: gameType,
      displayName: GAME_MODE_DISPLAY[gameType],
      status,
      issues,
      priority,
      gameId: lastGame.id,
      gameDate: lastGame.created_at,
      checks
    };

  } catch (error) {
    console.error(`❌ Error analizando modalidad ${gameType}:`, error.message);
    return {
      mode: gameType,
      status: '❌ ERROR',
      issues: [error.message],
      priority: 'CRÍTICA'
    };
  }
}

async function generateReport(userId, results) {
  console.log('\n\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' '.repeat(25) + '📋 REPORTE FINAL' + ' '.repeat(38) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');

  console.log('\n📊 RESUMEN POR MODALIDAD:\n');
  console.log('┌' + '─'.repeat(20) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(30) + '┬' + '─'.repeat(10) + '┐');
  console.log('│ Modalidad          │ Estado          │ Issues                         │ Prioridad  │');
  console.log('├' + '─'.repeat(20) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(30) + '┼' + '─'.repeat(10) + '┤');

  for (const result of results) {
    const mode = (result.displayName || result.mode).padEnd(18);
    const status = result.status.padEnd(15);
    const issues = (result.issues.length > 0 ? result.issues[0].substring(0, 28) : '-').padEnd(30);
    const priority = result.priority.padEnd(10);
    console.log(`│ ${mode} │ ${status} │ ${issues} │ ${priority} │`);
  }

  console.log('└' + '─'.repeat(20) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(30) + '┴' + '─'.repeat(10) + '┘');

  // Statistics
  const functional = results.filter(r => r.status.includes('✅')).length;
  const partial = results.filter(r => r.status.includes('⚠️')).length;
  const broken = results.filter(r => r.status.includes('❌')).length;
  const notTested = results.filter(r => r.status.includes('❓')).length;

  console.log('\n📈 ESTADÍSTICAS:');
  console.log(`   ✅ Funcionales: ${functional}/${results.length}`);
  console.log(`   ⚠️  Parciales: ${partial}/${results.length}`);
  console.log(`   ❌ Rotas: ${broken}/${results.length}`);
  console.log(`   ❓ No testeadas: ${notTested}/${results.length}`);

  const percentage = ((functional / results.length) * 100).toFixed(1);
  console.log(`\n🎯 PROGRESO: ${percentage}% de modalidades funcionales`);

  // Check user profile
  console.log('\n👤 VERIFICACIÓN DE PERFIL DE USUARIO:\n');
  const profile = await checkUserProfileUpdates(userId);

  if (profile) {
    console.log(`   Usuario: ${profile.nickname}`);
    console.log(`   Respuestas en historial: ${profile.num_respuestas || 0}`);
    console.log(`   Stats disponibles: ${profile.stats ? '✅' : '❌'}`);

    if (profile.stats && profile.stats.consolidation) {
      const consolidation = profile.stats.consolidation;
      console.log(`   Consolidación de conocimiento:`);
      if (consolidation.byBlock) {
        const blocks = Object.keys(consolidation.byBlock).length;
        console.log(`     - Bloques con datos: ${blocks}`);
      }
    }
  } else {
    console.log('   ❌ No se pudo obtener información del perfil');
  }

  // Recommendations
  console.log('\n💡 RECOMENDACIONES:\n');

  const criticalIssues = results.filter(r => r.priority === 'CRÍTICA');
  if (criticalIssues.length > 0) {
    console.log('   🔴 PRIORIDAD CRÍTICA:');
    criticalIssues.forEach(r => {
      console.log(`      - ${r.displayName || r.mode}: ${r.issues.join(', ')}`);
    });
  }

  const mediumIssues = results.filter(r => r.priority === 'MEDIA');
  if (mediumIssues.length > 0) {
    console.log('\n   🟡 PRIORIDAD MEDIA:');
    mediumIssues.forEach(r => {
      console.log(`      - ${r.displayName || r.mode}: ${r.issues.join(', ')}`);
    });
  }

  if (notTested > 0) {
    console.log('\n   ⚠️  PENDIENTE DE TESTING:');
    results.filter(r => r.status.includes('❓')).forEach(r => {
      console.log(`      - ${r.displayName || r.mode}`);
    });
  }

  console.log('\n' + '═'.repeat(80));
}

async function main() {
  console.log('🚀 Iniciando verificación automática de modalidades...\n');

  // Find user
  const user = await findUserByNickname('JaiGon');

  if (!user) {
    console.log('❌ No se puede continuar sin usuario');
    await pool.end();
    return;
  }

  // Analyze each game mode
  const results = [];

  for (const mode of GAME_MODES) {
    const result = await analyzeGameMode(user.id, mode);
    results.push(result);
  }

  // Generate final report
  await generateReport(user.id, results);

  await pool.end();
  console.log('\n✅ Verificación completada');
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  pool.end();
});

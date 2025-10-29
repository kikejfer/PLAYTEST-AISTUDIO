require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'lumiquiz-db-enferlo-lumiquiz.d.aivencloud.com',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 24407,
  database: process.env.DB_NAME || 'defaultdb',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

(async () => {
  try {
    console.log('\n📋 Verificando IDs de partidas rotas...\n');

    const result = await pool.query(`
      SELECT id, game_type, status, created_at
      FROM games
      WHERE id IN (266, 267, 268, 269, 271, 274)
      ORDER BY id
    `);

    console.log('Partidas rotas encontradas:', result.rows.length);
    result.rows.forEach(g => {
      console.log(`   ID ${g.id} | ${g.game_type.padEnd(15)} | ${g.status.padEnd(10)} | ${g.created_at}`);
    });

    console.log('\n🔍 Verificando si tienen jugadores...\n');

    for (const game of result.rows) {
      const players = await pool.query(
        'SELECT user_id, nickname FROM game_players WHERE game_id = $1',
        [game.id]
      );
      console.log(`   Game ${game.id}: ${players.rows.length} jugador(es) - ${players.rows.map(p => p.nickname).join(', ')}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
})();

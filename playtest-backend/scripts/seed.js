
const pool = require('../database/connection');

const seed = async () => {
  try {
    console.log('Seeding database...');

    // Seed roles
    const roles = [
      { name: 'administrador_principal', description: 'Full access to the platform' },
      { name: 'administrador_secundario', description: 'Limited administrative access' },
      { name: 'profesor', description: 'Teacher role' },
      { name: 'creador', description: 'Content creator role' },
      { name: 'jugador', description: 'Player role, default for new users' },
      { name: 'soporte_tecnico', description: 'Technical support role' },
    ];

    for (const role of roles) {
      await pool.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [role.name, role.description]
      );
    }

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    pool.end();
  }
};

seed();

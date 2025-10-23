const bcrypt = require('bcrypt');
const { pool } = require('./database/connection');

async function resetPassword() {
  const nickname = 'playertester01';
  const newPassword = 'test123';

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE nickname = $2 RETURNING id, nickname',
      [hashedPassword, nickname]
    );

    if (result.rows.length === 0) {
      console.log('User not found');
    } else {
      console.log('Password reset successfully for user:', result.rows[0].nickname);
      console.log('New password:', newPassword);
    }
  } catch (error) {
    console.error('Error resetting password:', error.message);
  } finally {
    await pool.end();
  }
}

resetPassword();

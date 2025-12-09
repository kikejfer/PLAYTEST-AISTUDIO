/**
 * GAMIFICACION CONTROLLER
 * CORRECTED: All functions now accept a `pool` object to perform database queries.
 */

// NO LONGER NEEDED: const { pool } = require('../database/connection');

// ============================================
// BADGES Y LOGROS
// ============================================

async function obtenerBadgesDisponibles(pool) {
    const result = await pool.query('SELECT id, nombre, descripcion, icono, tipo FROM badges ORDER BY orden_visualizacion');
    return { success: true, badges: result.rows };
}

async function obtenerBadgesAlumno(pool, alumnoId, oposicionId) {
    let query = `
        SELECT b.id, b.nombre, b.descripcion, b.icono, ab.obtenido_en
        FROM alumno_badges ab
        JOIN badges b ON ab.badge_id = b.id
        WHERE ab.alumno_id = $1`;
    const params = [alumnoId];

    if (oposicionId) {
        query += ' AND (ab.oposicion_id = $2 OR ab.oposicion_id IS NULL)';
        params.push(oposicionId);
    }
    query += ' ORDER BY ab.obtenido_en DESC';

    const result = await pool.query(query, params);
    return { success: true, badges: result.rows };
}

// ============================================
// SISTEMA DE PUNTOS Y RANKING
// ============================================

async function actualizarPuntosAlumno(pool, alumnoId, oposicionId) {
    await pool.query('SELECT actualizar_puntos_gamificacion($1, $2)', [alumnoId, oposicionId]);
    const result = await pool.query('SELECT * FROM puntos_gamificacion WHERE alumno_id = $1 AND oposicion_id = $2', [alumnoId, oposicionId]);
    return { success: true, puntos: result.rows[0] || null };
}

async function obtenerRanking(pool, oposicionId, limite = 50) {
    const result = await pool.query(
        `SELECT pg.alumno_id, u.nickname, pg.puntos_totales, pg.nivel, ROW_NUMBER() OVER (ORDER BY pg.puntos_totales DESC) as posicion
         FROM puntos_gamificacion pg
         JOIN users u ON pg.alumno_id = u.id
         WHERE pg.oposicion_id = $1
         ORDER BY posicion ASC
         LIMIT $2`,
        [oposicionId, limite]
    );
    return { success: true, ranking: result.rows };
}

async function obtenerPosicionAlumno(pool, alumnoId, oposicionId) {
    const result = await pool.query(
        `WITH ranking AS (
            SELECT alumno_id, ROW_NUMBER() OVER (ORDER BY puntos_totales DESC) as posicion
            FROM puntos_gamificacion WHERE oposicion_id = $2
         )
         SELECT posicion FROM ranking WHERE alumno_id = $1`,
        [alumnoId, oposicionId]
    );
    return { success: true, posicion: result.rows[0] || null };
}

// ============================================
// TORNEOS
// ============================================

async function crearTorneo(pool, profesorId, data) {
    const { oposicion_id, nombre, fecha_inicio, fecha_fin, tipo } = data;
    if (!oposicion_id || !nombre || !fecha_inicio || !fecha_fin || !tipo) {
        throw new Error('Datos incompletos para crear torneo');
    }
    const result = await pool.query(
        `INSERT INTO torneos (oposicion_id, profesor_id, nombre, fecha_inicio, fecha_fin, tipo) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [oposicion_id, profesorId, nombre, fecha_inicio, fecha_fin, tipo]
    );
    return { success: true, torneo: result.rows[0] };
}

async function obtenerTorneos(pool, oposicionId, filtros = {}) {
    let query = 'SELECT * FROM torneos WHERE oposicion_id = $1';
    const params = [oposicionId];
    if (filtros.estado) {
        params.push(filtros.estado);
        query += ` AND estado = $${params.length}`;
    }
    query += ' ORDER BY fecha_inicio DESC';
    const result = await pool.query(query, params);
    return { success: true, torneos: result.rows };
}

async function inscribirEnTorneo(pool, alumnoId, torneoId) {
    // Using a transaction for safety
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const torneoResult = await client.query('SELECT id, estado FROM torneos WHERE id = $1 FOR UPDATE', [torneoId]);
        if (torneoResult.rows.length === 0 || torneoResult.rows[0].estado !== 'pendiente') {
            throw new Error('El torneo no está abierto para inscripciones');
        }
        const result = await client.query('INSERT INTO torneo_participantes (torneo_id, alumno_id) VALUES ($1, $2) RETURNING *', [torneoId, alumnoId]);
        await client.query('COMMIT');
        return { success: true, participante: result.rows[0] };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

async function finalizarParticipacionTorneo(pool, participanteId, respuestas) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Simplified logic: Calculate score and update participant status
        let correctas = 0;
        for (const resp of respuestas) {
             const pregunta = await client.query('SELECT correct_answer FROM questions WHERE id = $1', [resp.pregunta_id]);
             if(pregunta.rows[0].correct_answer.toLowerCase() === resp.respuesta.toLowerCase()) correctas++;
        }
        const puntuacion = correctas * 10;

        await client.query(
            'UPDATE torneo_participantes SET puntuacion = $1, completado = true WHERE id = $2',
            [puntuacion, participanteId]
        );
        
        await client.query('COMMIT');
        return { success: true, puntuacion: puntuacion };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}


module.exports = {
    obtenerBadgesDisponibles,
    obtenerBadgesAlumno,
    actualizarPuntosAlumno,
    obtenerRanking,
    obtenerPosicionAlumno,
    crearTorneo,
    obtenerTorneos,
    inscribirEnTorneo,
    finalizarParticipacionTorneo
    // Simplified module exports to match the refactored functions
};
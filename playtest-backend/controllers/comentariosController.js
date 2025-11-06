const { pool } = require('../database/connection');

/**
 * CONTROLADOR: Comentarios Profesor
 * Gestión de comentarios del profesor por bloque/alumno
 */

/**
 * Crear comentario del profesor
 */
async function crearComentario(profesorId, alumnoId, bloqueId, comentario) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que el bloque pertenece a una oposición del profesor
        const checkOwnership = await client.query(`
            SELECT bt.id, o.nombre_oposicion, bt.nombre as bloque_nombre
            FROM bloques_temas bt
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE bt.id = $1 AND o.profesor_id = $2
        `, [bloqueId, profesorId]);

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Bloque no encontrado o sin permisos'
            };
        }

        // Verificar que el alumno está inscrito en la oposición
        const checkEnrollment = await client.query(`
            SELECT ce.id
            FROM class_enrollments ce
            JOIN oposiciones o ON ce.oposicion_id = o.id
            JOIN bloques_temas bt ON o.id = bt.oposicion_id
            WHERE ce.alumno_id = $1 AND bt.id = $2 AND ce.enrollment_status = 'active'
        `, [alumnoId, bloqueId]);

        if (checkEnrollment.rows.length === 0) {
            return {
                success: false,
                error: 'El alumno no está inscrito en la oposición correspondiente'
            };
        }

        // Crear comentario
        const insertQuery = `
            INSERT INTO comentarios_profesor (
                profesor_id,
                alumno_id,
                bloque_id,
                comentario
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const result = await client.query(insertQuery, [profesorId, alumnoId, bloqueId, comentario]);

        await client.query('COMMIT');

        return {
            success: true,
            comentario: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener comentarios de un alumno en un bloque específico
 */
async function obtenerComentariosBloque(alumnoId, bloqueId) {
    try {
        const query = `
            SELECT
                cp.*,
                u.nickname as profesor_nombre,
                bt.nombre as bloque_nombre
            FROM comentarios_profesor cp
            JOIN users u ON cp.profesor_id = u.id
            JOIN bloques_temas bt ON cp.bloque_id = bt.id
            WHERE cp.alumno_id = $1 AND cp.bloque_id = $2
            ORDER BY cp.created_at DESC
        `;

        const result = await pool.query(query, [alumnoId, bloqueId]);

        return {
            success: true,
            comentarios: result.rows
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Obtener todos los comentarios de un alumno
 */
async function obtenerComentariosAlumno(alumnoId, oposicionId = null) {
    try {
        const query = `
            SELECT
                cp.*,
                u.nickname as profesor_nombre,
                bt.nombre as bloque_nombre,
                bt.orden as bloque_orden,
                o.nombre_oposicion
            FROM comentarios_profesor cp
            JOIN users u ON cp.profesor_id = u.id
            JOIN bloques_temas bt ON cp.bloque_id = bt.id
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE cp.alumno_id = $1
            ${oposicionId ? 'AND o.id = $2' : ''}
            ORDER BY cp.created_at DESC
        `;

        const params = oposicionId ? [alumnoId, oposicionId] : [alumnoId];
        const result = await pool.query(query, params);

        return {
            success: true,
            comentarios: result.rows
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Obtener comentarios que ha hecho el profesor
 */
async function obtenerMisComentarios(profesorId, oposicionId = null, alumnoId = null) {
    try {
        let query = `
            SELECT
                cp.*,
                u.nickname as alumno_nombre,
                bt.nombre as bloque_nombre,
                bt.orden as bloque_orden,
                o.nombre_oposicion
            FROM comentarios_profesor cp
            JOIN users u ON cp.alumno_id = u.id
            JOIN bloques_temas bt ON cp.bloque_id = bt.id
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE cp.profesor_id = $1
        `;

        const params = [profesorId];
        let paramCount = 1;

        if (oposicionId) {
            paramCount++;
            query += ` AND o.id = $${paramCount}`;
            params.push(oposicionId);
        }

        if (alumnoId) {
            paramCount++;
            query += ` AND cp.alumno_id = $${paramCount}`;
            params.push(alumnoId);
        }

        query += ' ORDER BY cp.created_at DESC';

        const result = await pool.query(query, params);

        return {
            success: true,
            comentarios: result.rows
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Actualizar comentario
 */
async function actualizarComentario(profesorId, comentarioId, nuevoComentario) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que el comentario pertenece al profesor
        const checkOwnership = await client.query(
            'SELECT id FROM comentarios_profesor WHERE id = $1 AND profesor_id = $2',
            [comentarioId, profesorId]
        );

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Comentario no encontrado o sin permisos'
            };
        }

        // Actualizar comentario
        const updateQuery = `
            UPDATE comentarios_profesor
            SET comentario = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
        `;

        const result = await client.query(updateQuery, [nuevoComentario, comentarioId]);

        await client.query('COMMIT');

        return {
            success: true,
            comentario: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Eliminar comentario
 */
async function eliminarComentario(profesorId, comentarioId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que el comentario pertenece al profesor
        const checkOwnership = await client.query(
            'SELECT id FROM comentarios_profesor WHERE id = $1 AND profesor_id = $2',
            [comentarioId, profesorId]
        );

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Comentario no encontrado o sin permisos'
            };
        }

        // Eliminar comentario
        await client.query('DELETE FROM comentarios_profesor WHERE id = $1', [comentarioId]);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Comentario eliminado exitosamente'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener resumen de comentarios por alumno (para vista del profesor)
 */
async function obtenerResumenComentariosPorAlumno(profesorId, oposicionId) {
    try {
        // Verificar permisos
        const checkOwnership = await pool.query(
            'SELECT id FROM oposiciones WHERE id = $1 AND profesor_id = $2',
            [oposicionId, profesorId]
        );

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Oposición no encontrada o sin permisos'
            };
        }

        const query = `
            SELECT
                u.id as alumno_id,
                u.nickname as alumno_nombre,
                COUNT(cp.id) as total_comentarios,
                MAX(cp.created_at) as ultimo_comentario,
                json_agg(
                    json_build_object(
                        'bloque_nombre', bt.nombre,
                        'comentario', cp.comentario,
                        'fecha', cp.created_at
                    ) ORDER BY cp.created_at DESC
                ) FILTER (WHERE cp.id IS NOT NULL) as comentarios_recientes
            FROM class_enrollments ce
            JOIN users u ON ce.alumno_id = u.id
            LEFT JOIN comentarios_profesor cp ON ce.alumno_id = cp.alumno_id
            LEFT JOIN bloques_temas bt ON cp.bloque_id = bt.id AND bt.oposicion_id = ce.oposicion_id
            WHERE ce.oposicion_id = $1 AND ce.enrollment_status = 'active'
            GROUP BY u.id, u.nickname
            ORDER BY total_comentarios DESC, u.nickname
        `;

        const result = await pool.query(query, [oposicionId]);

        return {
            success: true,
            resumen: result.rows
        };

    } catch (error) {
        throw error;
    }
}

module.exports = {
    crearComentario,
    obtenerComentariosBloque,
    obtenerComentariosAlumno,
    obtenerMisComentarios,
    actualizarComentario,
    eliminarComentario,
    obtenerResumenComentariosPorAlumno
};

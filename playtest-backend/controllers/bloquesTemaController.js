const { getPool } = require('../database/connection');

/**
 * CONTROLADOR: Bloques y Temas
 * Gestión de bloques de temas y sus temas internos
 */

/**
 * Crear nuevo bloque de temas
 */
async function crearBloque(profesorId, oposicionId, data) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que la oposición pertenece al profesor
        const checkOwnership = await client.query(
            'SELECT id FROM oposiciones WHERE id = $1 AND profesor_id = $2',
            [oposicionId, profesorId]
        );

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Oposición no encontrada o sin permisos'
            };
        }

        // Obtener el siguiente orden disponible
        const ordenResult = await client.query(
            'SELECT COALESCE(MAX(orden), 0) + 1 as siguiente_orden FROM bloques_temas WHERE oposicion_id = $1',
            [oposicionId]
        );
        const orden = data.orden || ordenResult.rows[0].siguiente_orden;

        const insertQuery = `
            INSERT INTO bloques_temas (
                oposicion_id,
                nombre,
                descripcion,
                orden,
                tiempo_estimado_dias
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;

        const values = [
            oposicionId,
            data.nombre,
            data.descripcion || null,
            orden,
            data.tiempo_estimado_dias || 14
        ];

        const result = await client.query(insertQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            bloque: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener bloques de una oposición
 */
async function obtenerBloques(profesorId, oposicionId) {
    const pool = getPool();
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
                bt.*,
                COUNT(DISTINCT t.id) as num_temas,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', t.id,
                            'nombre', t.nombre,
                            'orden', t.orden,
                            'num_preguntas', t.num_preguntas
                        ) ORDER BY t.orden
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'::json
                ) as temas
            FROM bloques_temas bt
            LEFT JOIN temas t ON bt.id = t.bloque_id
            WHERE bt.oposicion_id = $1
            GROUP BY bt.id
            ORDER BY bt.orden ASC
        `;

        const result = await pool.query(query, [oposicionId]);

        return {
            success: true,
            bloques: result.rows
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Obtener detalle de un bloque específico
 */
async function obtenerDetalleBloque(profesorId, bloqueId) {
    const pool = getPool();
    try {
        const query = `
            SELECT
                bt.*,
                o.profesor_id,
                o.nombre_oposicion,
                COUNT(DISTINCT t.id) as num_temas,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', t.id,
                            'nombre', t.nombre,
                            'descripcion', t.descripcion,
                            'orden', t.orden,
                            'num_preguntas', t.num_preguntas
                        ) ORDER BY t.orden
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'::json
                ) as temas
            FROM bloques_temas bt
            JOIN oposiciones o ON bt.oposicion_id = o.id
            LEFT JOIN temas t ON bt.id = t.bloque_id
            WHERE bt.id = $1 AND o.profesor_id = $2
            GROUP BY bt.id, o.profesor_id, o.nombre_oposicion
        `;

        const result = await pool.query(query, [bloqueId, profesorId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Bloque no encontrado o sin permisos'
            };
        }

        return {
            success: true,
            bloque: result.rows[0]
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Actualizar bloque
 */
async function actualizarBloque(profesorId, bloqueId, data) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar permisos
        const checkOwnership = await client.query(\`
            SELECT bt.id FROM bloques_temas bt
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE bt.id = $1 AND o.profesor_id = $2
        \`, [bloqueId, profesorId]);

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Bloque no encontrado o sin permisos'
            };
        }

        const updateQuery = \`
            UPDATE bloques_temas SET
                nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                tiempo_estimado_dias = COALESCE($3, tiempo_estimado_dias),
                orden = COALESCE($4, orden),
                updated_at = NOW()
            WHERE id = $5
            RETURNING *
        \`;

        const values = [
            data.nombre || null,
            data.descripcion || null,
            data.tiempo_estimado_dias || null,
            data.orden || null,
            bloqueId
        ];

        const result = await client.query(updateQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            bloque: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Eliminar bloque
 */
async function eliminarBloque(profesorId, bloqueId) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar permisos
        const checkOwnership = await client.query(\`
            SELECT bt.id FROM bloques_temas bt
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE bt.id = $1 AND o.profesor_id = $2
        \`, [bloqueId, profesorId]);

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Bloque no encontrado o sin permisos'
            };
        }

        // Eliminar bloque (CASCADE eliminará temas y relaciones)
        await client.query('DELETE FROM bloques_temas WHERE id = $1', [bloqueId]);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Bloque eliminado exitosamente'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Crear nuevo tema dentro de un bloque
 */
async function crearTema(profesorId, bloqueId, data) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar permisos
        const checkOwnership = await client.query(\`
            SELECT bt.id FROM bloques_temas bt
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE bt.id = $1 AND o.profesor_id = $2
        \`, [bloqueId, profesorId]);

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Bloque no encontrado o sin permisos'
            };
        }

        // Obtener el siguiente orden disponible
        const ordenResult = await client.query(
            'SELECT COALESCE(MAX(orden), 0) + 1 as siguiente_orden FROM temas WHERE bloque_id = $1',
            [bloqueId]
        );
        const orden = data.orden || ordenResult.rows[0].siguiente_orden;

        const insertQuery = \`
            INSERT INTO temas (
                bloque_id,
                nombre,
                descripcion,
                orden
            ) VALUES ($1, $2, $3, $4)
            RETURNING *
        \`;

        const values = [
            bloqueId,
            data.nombre,
            data.descripcion || null,
            orden
        ];

        const result = await client.query(insertQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            tema: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Actualizar tema
 */
async function actualizarTema(profesorId, temaId, data) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar permisos
        const checkOwnership = await client.query(\`
            SELECT t.id FROM temas t
            JOIN bloques_temas bt ON t.bloque_id = bt.id
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE t.id = $1 AND o.profesor_id = $2
        \`, [temaId, profesorId]);

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Tema no encontrado o sin permisos'
            };
        }

        const updateQuery = \`
            UPDATE temas SET
                nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                orden = COALESCE($3, orden),
                updated_at = NOW()
            WHERE id = $4
            RETURNING *
        \`;

        const values = [
            data.nombre || null,
            data.descripcion || null,
            data.orden || null,
            temaId
        ];

        const result = await client.query(updateQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            tema: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Eliminar tema
 */
async function eliminarTema(profesorId, temaId) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar permisos
        const checkOwnership = await client.query(\`
            SELECT t.id FROM temas t
            JOIN bloques_temas bt ON t.bloque_id = bt.id
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE t.id = $1 AND o.profesor_id = $2
        \`, [temaId, profesorId]);

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Tema no encontrado o sin permisos'
            };
        }

        // Eliminar tema (CASCADE actualizará preguntas a tema_id NULL)
        await client.query('DELETE FROM temas WHERE id = $1', [temaId]);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Tema eliminado exitosamente'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Asignar pregunta a tema
 */
async function asignarPreguntaATema(profesorId, preguntaId, temaId) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar permisos sobre el tema
        const checkOwnership = await client.query(\`
            SELECT t.id FROM temas t
            JOIN bloques_temas bt ON t.bloque_id = bt.id
            JOIN oposiciones o ON bt.oposicion_id = o.id
            WHERE t.id = $1 AND o.profesor_id = $2
        \`, [temaId, profesorId]);

        if (checkOwnership.rows.length === 0) {
            return {
                success: false,
                error: 'Tema no encontrado o sin permisos'
            };
        }

        // Actualizar pregunta
        const updateQuery = \`
            UPDATE questions
            SET tema_id = $1
            WHERE id = $2
            RETURNING *
        \`;

        const result = await client.query(updateQuery, [temaId, preguntaId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Pregunta no encontrada'
            };
        }

        // Recalcular total de preguntas del tema
        await client.query('SELECT calcular_total_preguntas_tema($1)', [temaId]);

        // Recalcular total de preguntas del bloque padre
        const bloqueResult = await client.query('SELECT bloque_id FROM temas WHERE id = $1', [temaId]);
        if (bloqueResult.rows.length > 0) {
            await client.query('SELECT calcular_total_preguntas_bloque($1)', [bloqueResult.rows[0].bloque_id]);
        }

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Pregunta asignada al tema exitosamente'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Recalcular totales de preguntas de un bloque
 */
async function recalcularTotalesBloque(bloqueId) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Recalcular totales de todos los temas del bloque
        const temas = await client.query('SELECT id FROM temas WHERE bloque_id = $1', [bloqueId]);

        for (const tema of temas.rows) {
            await client.query('SELECT calcular_total_preguntas_tema($1)', [tema.id]);
        }

        // Recalcular total del bloque
        await client.query('SELECT calcular_total_preguntas_bloque($1)', [bloqueId]);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Totales recalculados'
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    crearBloque,
    obtenerBloques,
    obtenerDetalleBloque,
    actualizarBloque,
    eliminarBloque,
    crearTema,
    actualizarTema,
    eliminarTema,
    asignarPreguntaATema,
    recalcularTotalesBloque
};

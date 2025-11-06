/**
 * GAMIFICACION CONTROLLER
 * Gestión de badges, rankings, torneos y sistema de puntos
 */

const { pool } = require('../database/connection');

// ============================================
// BADGES Y LOGROS
// ============================================

/**
 * Obtener todos los badges disponibles
 */
async function obtenerBadgesDisponibles() {
    const result = await pool.query(`
        SELECT
            id,
            codigo,
            nombre,
            descripcion,
            icono,
            tipo,
            criterio_valor,
            puntos_otorga,
            es_secreto,
            orden_visualizacion
        FROM badges
        ORDER BY orden_visualizacion, nombre
    `);

    return {
        success: true,
        badges: result.rows
    };
}

/**
 * Obtener badges de un alumno
 */
async function obtenerBadgesAlumno(alumnoId, oposicionId = null) {
    let query = `
        SELECT
            ab.id,
            ab.obtenido_en,
            b.codigo,
            b.nombre,
            b.descripcion,
            b.icono,
            b.tipo,
            b.puntos_otorga,
            o.nombre_oposicion
        FROM alumno_badges ab
        JOIN badges b ON ab.badge_id = b.id
        LEFT JOIN oposiciones o ON ab.oposicion_id = o.id
        WHERE ab.alumno_id = $1
    `;
    const params = [alumnoId];

    if (oposicionId) {
        query += ` AND (ab.oposicion_id = $2 OR ab.oposicion_id IS NULL)`;
        params.push(oposicionId);
    }

    query += ` ORDER BY ab.obtenido_en DESC`;

    const result = await pool.query(query, params);

    return {
        success: true,
        badges: result.rows
    };
}

/**
 * Verificar y otorgar badges automáticos
 */
async function verificarYOtorgarBadges(alumnoId, oposicionId) {
    try {
        const result = await pool.query(
            'SELECT verificar_badges_automaticos($1, $2) as badges_otorgados',
            [alumnoId, oposicionId]
        );

        const badgesOtorgados = result.rows[0].badges_otorgados;

        // Obtener badges nuevos
        let nuevosBadges = [];
        if (badgesOtorgados > 0) {
            const badgesResult = await pool.query(`
                SELECT
                    b.nombre,
                    b.descripcion,
                    b.icono,
                    b.puntos_otorga
                FROM alumno_badges ab
                JOIN badges b ON ab.badge_id = b.id
                WHERE ab.alumno_id = $1
                  AND ab.oposicion_id = $2
                  AND ab.notificado = false
            `, [alumnoId, oposicionId]);

            nuevosBadges = badgesResult.rows;

            // Marcar como notificados
            await pool.query(`
                UPDATE alumno_badges
                SET notificado = true
                WHERE alumno_id = $1 AND oposicion_id = $2 AND notificado = false
            `, [alumnoId, oposicionId]);
        }

        return {
            success: true,
            badges_otorgados: badgesOtorgados,
            nuevos_badges: nuevosBadges
        };
    } catch (error) {
        console.error('Error verificando badges:', error);
        throw error;
    }
}

// ============================================
// SISTEMA DE PUNTOS Y RANKING
// ============================================

/**
 * Actualizar puntos de gamificación de un alumno
 */
async function actualizarPuntosAlumno(alumnoId, oposicionId) {
    try {
        await pool.query(
            'SELECT actualizar_puntos_gamificacion($1, $2)',
            [alumnoId, oposicionId]
        );

        // Obtener puntos actualizados
        const result = await pool.query(`
            SELECT
                puntos_totales,
                puntos_progreso,
                puntos_badges,
                puntos_torneos,
                puntos_racha,
                nivel,
                experiencia,
                experiencia_siguiente_nivel
            FROM puntos_gamificacion
            WHERE alumno_id = $1 AND oposicion_id = $2
        `, [alumnoId, oposicionId]);

        return {
            success: true,
            puntos: result.rows[0] || null
        };
    } catch (error) {
        console.error('Error actualizando puntos:', error);
        throw error;
    }
}

/**
 * Obtener ranking de una oposición
 */
async function obtenerRanking(oposicionId, limite = 50) {
    const result = await pool.query(`
        SELECT
            pg.alumno_id,
            u.nickname,
            u.email,
            pg.puntos_totales,
            pg.nivel,
            pg.puntos_progreso,
            pg.puntos_badges,
            pg.puntos_torneos,
            pg.puntos_racha,
            ca.porcentaje_progreso,
            ca.estado,
            COUNT(DISTINCT ab.badge_id) as total_badges,
            ROW_NUMBER() OVER (ORDER BY pg.puntos_totales DESC, pg.nivel DESC) as posicion
        FROM puntos_gamificacion pg
        JOIN users u ON pg.alumno_id = u.id
        LEFT JOIN cronograma_alumno ca ON pg.alumno_id = ca.alumno_id AND pg.oposicion_id = ca.oposicion_id
        LEFT JOIN alumno_badges ab ON pg.alumno_id = ab.alumno_id AND (ab.oposicion_id = pg.oposicion_id OR ab.oposicion_id IS NULL)
        WHERE pg.oposicion_id = $1
        GROUP BY pg.alumno_id, u.nickname, u.email, pg.puntos_totales, pg.nivel,
                 pg.puntos_progreso, pg.puntos_badges, pg.puntos_torneos, pg.puntos_racha,
                 ca.porcentaje_progreso, ca.estado
        ORDER BY pg.puntos_totales DESC, pg.nivel DESC
        LIMIT $2
    `, [oposicionId, limite]);

    return {
        success: true,
        ranking: result.rows
    };
}

/**
 * Obtener posición de un alumno en el ranking
 */
async function obtenerPosicionAlumno(alumnoId, oposicionId) {
    const result = await pool.query(`
        WITH ranking AS (
            SELECT
                alumno_id,
                puntos_totales,
                ROW_NUMBER() OVER (ORDER BY puntos_totales DESC) as posicion
            FROM puntos_gamificacion
            WHERE oposicion_id = $2
        )
        SELECT
            r.posicion,
            r.puntos_totales,
            (SELECT COUNT(*) FROM puntos_gamificacion WHERE oposicion_id = $2) as total_alumnos
        FROM ranking r
        WHERE r.alumno_id = $1
    `, [alumnoId, oposicionId]);

    return {
        success: true,
        posicion: result.rows[0] || null
    };
}

// ============================================
// RACHAS DE ESTUDIO
// ============================================

/**
 * Actualizar racha de estudio
 */
async function actualizarRacha(alumnoId, oposicionId) {
    try {
        await pool.query(
            'SELECT actualizar_racha_estudio($1, $2)',
            [alumnoId, oposicionId]
        );

        // Obtener racha actualizada
        const result = await pool.query(`
            SELECT
                racha_actual,
                racha_maxima,
                ultima_actividad
            FROM rachas_estudio
            WHERE alumno_id = $1 AND oposicion_id = $2
        `, [alumnoId, oposicionId]);

        return {
            success: true,
            racha: result.rows[0] || null
        };
    } catch (error) {
        console.error('Error actualizando racha:', error);
        throw error;
    }
}

/**
 * Obtener racha de un alumno
 */
async function obtenerRacha(alumnoId, oposicionId) {
    const result = await pool.query(`
        SELECT
            racha_actual,
            racha_maxima,
            ultima_actividad
        FROM rachas_estudio
        WHERE alumno_id = $1 AND oposicion_id = $2
    `, [alumnoId, oposicionId]);

    return {
        success: true,
        racha: result.rows[0] || { racha_actual: 0, racha_maxima: 0, ultima_actividad: null }
    };
}

// ============================================
// TORNEOS
// ============================================

/**
 * Crear torneo
 */
async function crearTorneo(profesorId, oposicionId, data) {
    const {
        nombre,
        descripcion,
        tipo,
        bloque_id,
        fecha_inicio,
        fecha_fin,
        max_participantes,
        num_preguntas,
        premios
    } = data;

    // Validaciones
    if (!nombre || !tipo || !fecha_inicio || !fecha_fin) {
        throw new Error('Datos incompletos para crear torneo');
    }

    if (new Date(fecha_inicio) >= new Date(fecha_fin)) {
        throw new Error('La fecha de inicio debe ser anterior a la fecha de fin');
    }

    const result = await pool.query(`
        INSERT INTO torneos (
            oposicion_id,
            profesor_id,
            nombre,
            descripcion,
            tipo,
            bloque_id,
            fecha_inicio,
            fecha_fin,
            max_participantes,
            num_preguntas,
            premios
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
    `, [
        oposicionId,
        profesorId,
        nombre,
        descripcion || null,
        tipo,
        bloque_id || null,
        fecha_inicio,
        fecha_fin,
        max_participantes || null,
        num_preguntas || 20,
        premios ? JSON.stringify(premios) : null
    ]);

    return {
        success: true,
        torneo: result.rows[0]
    };
}

/**
 * Obtener torneos de una oposición
 */
async function obtenerTorneos(oposicionId, filtros = {}) {
    let query = `
        SELECT
            t.*,
            u.nickname as profesor_nombre,
            bt.nombre as bloque_nombre,
            COUNT(DISTINCT tp.alumno_id) as num_participantes
        FROM torneos t
        JOIN users u ON t.profesor_id = u.id
        LEFT JOIN bloques_temas bt ON t.bloque_id = bt.id
        LEFT JOIN torneo_participantes tp ON t.id = tp.torneo_id
        WHERE t.oposicion_id = $1
    `;
    const params = [oposicionId];

    if (filtros.estado) {
        params.push(filtros.estado);
        query += ` AND t.estado = $${params.length}`;
    }

    query += `
        GROUP BY t.id, u.nickname, bt.nombre
        ORDER BY t.fecha_inicio DESC
    `;

    const result = await pool.query(query, params);

    return {
        success: true,
        torneos: result.rows
    };
}

/**
 * Inscribir alumno en torneo
 */
async function inscribirEnTorneo(alumnoId, torneoId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar que el torneo existe y está activo/pendiente
        const torneoResult = await client.query(`
            SELECT id, estado, max_participantes, oposicion_id, fecha_inicio
            FROM torneos
            WHERE id = $1
        `, [torneoId]);

        if (torneoResult.rows.length === 0) {
            throw new Error('Torneo no encontrado');
        }

        const torneo = torneoResult.rows[0];

        if (torneo.estado !== 'pendiente' && torneo.estado !== 'activo') {
            throw new Error('El torneo no está abierto para inscripciones');
        }

        // Verificar que el alumno está inscrito en la oposición
        const inscripcionResult = await client.query(`
            SELECT 1 FROM class_enrollments
            WHERE alumno_id = $1 AND oposicion_id = $2 AND enrollment_status = 'active'
        `, [alumnoId, torneo.oposicion_id]);

        if (inscripcionResult.rows.length === 0) {
            throw new Error('No estás inscrito en esta oposición');
        }

        // Verificar límite de participantes
        if (torneo.max_participantes) {
            const participantesResult = await client.query(
                'SELECT COUNT(*) as count FROM torneo_participantes WHERE torneo_id = $1',
                [torneoId]
            );

            if (parseInt(participantesResult.rows[0].count) >= torneo.max_participantes) {
                throw new Error('El torneo ha alcanzado su límite de participantes');
            }
        }

        // Inscribir
        const result = await client.query(`
            INSERT INTO torneo_participantes (torneo_id, alumno_id)
            VALUES ($1, $2)
            RETURNING *
        `, [torneoId, alumnoId]);

        await client.query('COMMIT');

        return {
            success: true,
            participante: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener detalle de torneo con participantes
 */
async function obtenerDetalleTorneo(torneoId) {
    // Obtener información del torneo
    const torneoResult = await pool.query(`
        SELECT
            t.*,
            u.nickname as profesor_nombre,
            bt.nombre as bloque_nombre,
            o.nombre_oposicion
        FROM torneos t
        JOIN users u ON t.profesor_id = u.id
        LEFT JOIN bloques_temas bt ON t.bloque_id = bt.id
        JOIN oposiciones o ON t.oposicion_id = o.id
        WHERE t.id = $1
    `, [torneoId]);

    if (torneoResult.rows.length === 0) {
        throw new Error('Torneo no encontrado');
    }

    const torneo = torneoResult.rows[0];

    // Obtener participantes con ranking
    const participantesResult = await pool.query(`
        SELECT
            tp.id as participante_id,
            tp.alumno_id,
            u.nickname,
            tp.fecha_inscripcion,
            tp.fecha_participacion,
            tp.puntuacion,
            tp.respuestas_correctas,
            tp.respuestas_incorrectas,
            tp.tiempo_total_segundos,
            tp.posicion,
            tp.completado
        FROM torneo_participantes tp
        JOIN users u ON tp.alumno_id = u.id
        WHERE tp.torneo_id = $1
        ORDER BY
            CASE WHEN tp.completado THEN 0 ELSE 1 END,
            tp.puntuacion DESC,
            tp.tiempo_total_segundos ASC
    `, [torneoId]);

    return {
        success: true,
        torneo,
        participantes: participantesResult.rows
    };
}

/**
 * Iniciar participación en torneo
 */
async function iniciarParticipacionTorneo(alumnoId, torneoId) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar que está inscrito
        const participanteResult = await client.query(`
            SELECT id, completado FROM torneo_participantes
            WHERE torneo_id = $1 AND alumno_id = $2
        `, [torneoId, alumnoId]);

        if (participanteResult.rows.length === 0) {
            throw new Error('No estás inscrito en este torneo');
        }

        if (participanteResult.rows[0].completado) {
            throw new Error('Ya has completado este torneo');
        }

        // Obtener configuración del torneo
        const torneoResult = await client.query(`
            SELECT num_preguntas, bloque_id, oposicion_id, tipo
            FROM torneos
            WHERE id = $1 AND estado = 'activo'
        `, [torneoId]);

        if (torneoResult.rows.length === 0) {
            throw new Error('El torneo no está activo');
        }

        const torneo = torneoResult.rows[0];

        // Seleccionar preguntas aleatorias
        let preguntasQuery = `
            SELECT
                q.id,
                q.question_text,
                q.option_a,
                q.option_b,
                q.option_c,
                q.option_d,
                q.correct_answer
            FROM questions q
            JOIN temas t ON q.tema_id = t.id
            JOIN bloques_temas bt ON t.bloque_id = bt.id
            WHERE bt.oposicion_id = $1
        `;
        const preguntasParams = [torneo.oposicion_id];

        if (torneo.bloque_id) {
            preguntasQuery += ` AND bt.id = $2`;
            preguntasParams.push(torneo.bloque_id);
        }

        preguntasQuery += ` ORDER BY RANDOM() LIMIT ${torneo.num_preguntas}`;

        const preguntasResult = await client.query(preguntasQuery, preguntasParams);

        // Marcar fecha de participación
        await client.query(`
            UPDATE torneo_participantes
            SET fecha_participacion = NOW()
            WHERE id = $1
        `, [participanteResult.rows[0].id]);

        await client.query('COMMIT');

        return {
            success: true,
            participante_id: participanteResult.rows[0].id,
            preguntas: preguntasResult.rows,
            tipo_torneo: torneo.tipo
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Finalizar participación en torneo
 */
async function finalizarParticipacionTorneo(participanteId, respuestas) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Obtener información del participante y torneo
        const participanteResult = await client.query(`
            SELECT tp.*, t.tipo, t.id as torneo_id, t.oposicion_id
            FROM torneo_participantes tp
            JOIN torneos t ON tp.torneo_id = t.id
            WHERE tp.id = $1
        `, [participanteId]);

        if (participanteResult.rows.length === 0) {
            throw new Error('Participante no encontrado');
        }

        const participante = participanteResult.rows[0];

        if (participante.completado) {
            throw new Error('Ya has completado este torneo');
        }

        // Calcular resultados
        let puntuacion = 0;
        let correctas = 0;
        let incorrectas = 0;
        let tiempoTotal = 0;

        for (const resp of respuestas) {
            const preguntaResult = await client.query(
                'SELECT correct_answer FROM questions WHERE id = $1',
                [resp.pregunta_id]
            );

            const esCorrecta = preguntaResult.rows[0].correct_answer.toLowerCase() === resp.respuesta.toLowerCase();

            if (esCorrecta) {
                correctas++;

                // Calcular puntos según tipo de torneo
                switch (participante.tipo) {
                    case 'puntos':
                        puntuacion += 100; // Puntos fijos por acierto
                        break;
                    case 'velocidad':
                        // Más puntos por responder rápido (máximo 200 puntos, mínimo 50)
                        const puntosVelocidad = Math.max(50, 200 - (resp.tiempo_segundos * 2));
                        puntuacion += Math.round(puntosVelocidad);
                        break;
                    case 'precision':
                        puntuacion += 150; // Más puntos por precisión, pero sin bonus de velocidad
                        break;
                    case 'resistencia':
                        puntuacion += 100; // Puntos estándar, lo importante es completar
                        break;
                }
            } else {
                incorrectas++;
            }

            tiempoTotal += resp.tiempo_segundos;

            // Registrar respuesta
            await client.query(`
                INSERT INTO torneo_respuestas (
                    participante_id,
                    pregunta_id,
                    respuesta,
                    correcta,
                    tiempo_segundos
                ) VALUES ($1, $2, $3, $4, $5)
            `, [participanteId, resp.pregunta_id, resp.respuesta, esCorrecta, resp.tiempo_segundos]);
        }

        // Actualizar participante
        await client.query(`
            UPDATE torneo_participantes
            SET
                puntuacion = $1,
                respuestas_correctas = $2,
                respuestas_incorrectas = $3,
                tiempo_total_segundos = $4,
                completado = true
            WHERE id = $5
        `, [puntuacion, correctas, incorrectas, tiempoTotal, participanteId]);

        // Recalcular posiciones del torneo
        await client.query(`
            UPDATE torneo_participantes
            SET posicion = subq.nueva_posicion
            FROM (
                SELECT
                    id,
                    ROW_NUMBER() OVER (
                        ORDER BY
                            puntuacion DESC,
                            tiempo_total_segundos ASC
                    ) as nueva_posicion
                FROM torneo_participantes
                WHERE torneo_id = $1 AND completado = true
            ) subq
            WHERE torneo_participantes.id = subq.id
        `, [participante.torneo_id]);

        // Verificar badges de torneos
        const posicionFinalResult = await client.query(
            'SELECT posicion FROM torneo_participantes WHERE id = $1',
            [participanteId]
        );
        const posicionFinal = posicionFinalResult.rows[0].posicion;

        // Badge: Primer torneo
        await client.query(`
            INSERT INTO alumno_badges (alumno_id, badge_id, oposicion_id)
            SELECT $1, id, $2
            FROM badges
            WHERE codigo = 'primer_torneo'
            ON CONFLICT DO NOTHING
        `, [participante.alumno_id, participante.oposicion_id]);

        // Badge: Top 3
        if (posicionFinal <= 3) {
            await client.query(`
                INSERT INTO alumno_badges (alumno_id, badge_id, oposicion_id)
                SELECT $1, id, $2
                FROM badges
                WHERE codigo = 'podium'
                ON CONFLICT DO NOTHING
            `, [participante.alumno_id, participante.oposicion_id]);
        }

        // Badge: Campeón
        if (posicionFinal === 1) {
            await client.query(`
                INSERT INTO alumno_badges (alumno_id, badge_id, oposicion_id)
                SELECT $1, id, $2
                FROM badges
                WHERE codigo = 'campeon'
                ON CONFLICT DO NOTHING
            `, [participante.alumno_id, participante.oposicion_id]);
        }

        // Actualizar puntos de gamificación
        await client.query(
            'SELECT actualizar_puntos_gamificacion($1, $2)',
            [participante.alumno_id, participante.oposicion_id]
        );

        await client.query('COMMIT');

        return {
            success: true,
            puntuacion,
            correctas,
            incorrectas,
            tiempo_total: tiempoTotal,
            posicion: posicionFinal
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = {
    // Badges
    obtenerBadgesDisponibles,
    obtenerBadgesAlumno,
    verificarYOtorgarBadges,

    // Puntos y ranking
    actualizarPuntosAlumno,
    obtenerRanking,
    obtenerPosicionAlumno,

    // Rachas
    actualizarRacha,
    obtenerRacha,

    // Torneos
    crearTorneo,
    obtenerTorneos,
    inscribirEnTorneo,
    obtenerDetalleTorneo,
    iniciarParticipacionTorneo,
    finalizarParticipacionTorneo
};

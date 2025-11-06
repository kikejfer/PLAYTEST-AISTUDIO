const { pool } = require('../database/connection');

/**
 * CONTROLADOR: Cronograma
 * Gestión de cronogramas automáticos personalizados por alumno
 */

/**
 * Generar cronograma para un alumno
 */
async function generarCronograma(alumnoId, oposicionId, fechaObjetivo) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que la oposición existe y está activa
        const oposicionCheck = await client.query(
            'SELECT id, nombre_oposicion FROM oposiciones WHERE id = $1 AND is_active = true',
            [oposicionId]
        );

        if (oposicionCheck.rows.length === 0) {
            return {
                success: false,
                error: 'Oposición no encontrada o inactiva'
            };
        }

        // Verificar que el alumno está inscrito
        const enrollmentCheck = await client.query(
            'SELECT id FROM class_enrollments WHERE oposicion_id = $1 AND alumno_id = $2',
            [oposicionId, alumnoId]
        );

        if (enrollmentCheck.rows.length === 0) {
            return {
                success: false,
                error: 'El alumno no está inscrito en esta oposición'
            };
        }

        // Verificar que no existe ya un cronograma
        const existingCheck = await client.query(
            'SELECT id FROM cronograma_alumno WHERE alumno_id = $1 AND oposicion_id = $2',
            [alumnoId, oposicionId]
        );

        if (existingCheck.rows.length > 0) {
            return {
                success: false,
                error: 'Ya existe un cronograma para este alumno en esta oposición'
            };
        }

        // Llamar a la función de base de datos para generar el cronograma
        const result = await client.query(
            'SELECT generar_cronograma_alumno($1, $2, $3) as cronograma_id',
            [alumnoId, oposicionId, fechaObjetivo]
        );

        const cronogramaId = result.rows[0].cronograma_id;

        // Obtener el cronograma generado
        const cronogramaData = await obtenerCronogramaAlumno(alumnoId, oposicionId);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Cronograma generado exitosamente',
            cronograma_id: cronogramaId,
            cronograma: cronogramaData.cronograma
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener cronograma de un alumno
 */
async function obtenerCronogramaAlumno(alumnoId, oposicionId) {
    try {
        const query = `
            SELECT
                ca.*,
                o.nombre_oposicion,
                o.codigo_acceso,
                json_agg(
                    json_build_object(
                        'bloque_id', cb.bloque_id,
                        'bloque_nombre', bt.nombre,
                        'bloque_orden', bt.orden,
                        'fecha_inicio_prevista', cb.fecha_inicio_prevista,
                        'fecha_fin_prevista', cb.fecha_fin_prevista,
                        'fecha_inicio_real', cb.fecha_inicio_real,
                        'fecha_fin_real', cb.fecha_fin_real,
                        'habilitado', cb.habilitado,
                        'completado', cb.completado,
                        'total_preguntas_bloque', cb.total_preguntas_bloque,
                        'preguntas_dominadas', cb.preguntas_dominadas,
                        'porcentaje_progreso', cb.porcentaje_progreso
                    ) ORDER BY bt.orden
                ) as bloques_cronograma
            FROM cronograma_alumno ca
            JOIN oposiciones o ON ca.oposicion_id = o.id
            LEFT JOIN cronograma_bloques cb ON ca.id = cb.cronograma_id
            LEFT JOIN bloques_temas bt ON cb.bloque_id = bt.id
            WHERE ca.alumno_id = $1 AND ca.oposicion_id = $2
            GROUP BY ca.id, o.nombre_oposicion, o.codigo_acceso
        `;

        const result = await pool.query(query, [alumnoId, oposicionId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Cronograma no encontrado'
            };
        }

        return {
            success: true,
            cronograma: result.rows[0]
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Actualizar fecha objetivo del alumno y recalcular cronograma
 */
async function actualizarFechaObjetivo(alumnoId, oposicionId, nuevaFechaObjetivo) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener cronograma existente
        const cronogramaResult = await client.query(
            'SELECT id FROM cronograma_alumno WHERE alumno_id = $1 AND oposicion_id = $2',
            [alumnoId, oposicionId]
        );

        if (cronogramaResult.rows.length === 0) {
            return {
                success: false,
                error: 'Cronograma no encontrado'
            };
        }

        const cronogramaId = cronogramaResult.rows[0].id;

        // Actualizar fecha objetivo
        await client.query(
            'UPDATE cronograma_alumno SET fecha_objetivo = $1, updated_at = NOW() WHERE id = $2',
            [nuevaFechaObjetivo, cronogramaId]
        );

        // Recalcular fechas de bloques
        const diasTotales = await client.query(
            'SELECT ($1::date - CURRENT_DATE) as dias',
            [nuevaFechaObjetivo]
        );

        const diasDisponibles = diasTotales.rows[0].dias;

        if (diasDisponibles <= 0) {
            return {
                success: false,
                error: 'La fecha objetivo debe ser futura'
            };
        }

        // Obtener bloques y recalcular fechas
        const bloques = await client.query(`
            SELECT cb.id, bt.tiempo_estimado_dias, bt.orden
            FROM cronograma_bloques cb
            JOIN bloques_temas bt ON cb.bloque_id = bt.id
            WHERE cb.cronograma_id = $1
            ORDER BY bt.orden
        `, [cronogramaId]);

        // Calcular total de días estimados
        const totalDiasEstimados = bloques.rows.reduce((sum, b) => sum + b.tiempo_estimado_dias, 0);

        let fechaInicio = new Date();

        for (const bloque of bloques.rows) {
            const proporcion = bloque.tiempo_estimado_dias / totalDiasEstimados;
            const diasBloque = Math.ceil(diasDisponibles * proporcion);

            const fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate() + diasBloque);

            await client.query(`
                UPDATE cronograma_bloques
                SET fecha_inicio_prevista = $1,
                    fecha_fin_prevista = $2,
                    updated_at = NOW()
                WHERE id = $3
            `, [fechaInicio, fechaFin, bloque.id]);

            fechaInicio = new Date(fechaFin);
            fechaInicio.setDate(fechaInicio.getDate() + 1);
        }

        await client.query('COMMIT');

        // Obtener cronograma actualizado
        const cronogramaActualizado = await obtenerCronogramaAlumno(alumnoId, oposicionId);

        return {
            success: true,
            message: 'Fecha objetivo actualizada y cronograma recalculado',
            cronograma: cronogramaActualizado.cronograma
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Habilitar siguiente bloque manualmente (fuerza habilitación)
 */
async function habilitarSiguienteBloque(alumnoId, oposicionId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener cronograma
        const cronogramaResult = await client.query(
            'SELECT id FROM cronograma_alumno WHERE alumno_id = $1 AND oposicion_id = $2',
            [alumnoId, oposicionId]
        );

        if (cronogramaResult.rows.length === 0) {
            return {
                success: false,
                error: 'Cronograma no encontrado'
            };
        }

        const cronogramaId = cronogramaResult.rows[0].id;

        // Buscar el siguiente bloque no habilitado
        const siguienteBloque = await client.query(`
            SELECT cb.id, bt.nombre, bt.orden
            FROM cronograma_bloques cb
            JOIN bloques_temas bt ON cb.bloque_id = bt.id
            WHERE cb.cronograma_id = $1 AND cb.habilitado = false
            ORDER BY bt.orden
            LIMIT 1
        `, [cronogramaId]);

        if (siguienteBloque.rows.length === 0) {
            return {
                success: false,
                error: 'No hay más bloques para habilitar'
            };
        }

        // Habilitar bloque
        await client.query(`
            UPDATE cronograma_bloques
            SET habilitado = true,
                fecha_inicio_real = CURRENT_DATE,
                updated_at = NOW()
            WHERE id = $1
        `, [siguienteBloque.rows[0].id]);

        await client.query('COMMIT');

        return {
            success: true,
            message: `Bloque "${siguienteBloque.rows[0].nombre}" habilitado`,
            bloque_nombre: siguienteBloque.rows[0].nombre
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Actualizar estado del cronograma (adelantado/en tiempo/retrasado)
 */
async function actualizarEstadoCronograma(alumnoId, oposicionId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Obtener cronograma y bloques
        const cronogramaData = await client.query(`
            SELECT
                ca.id,
                ca.total_preguntas_oposicion,
                ca.preguntas_dominadas,
                ca.fecha_objetivo,
                (ca.fecha_objetivo - CURRENT_DATE) as dias_restantes,
                (CURRENT_DATE - ca.fecha_inscripcion) as dias_transcurridos
            FROM cronograma_alumno ca
            WHERE ca.alumno_id = $1 AND ca.oposicion_id = $2
        `, [alumnoId, oposicionId]);

        if (cronogramaData.rows.length === 0) {
            return {
                success: false,
                error: 'Cronograma no encontrado'
            };
        }

        const cronograma = cronogramaData.rows[0];
        const diasTotales = cronograma.dias_restantes + cronograma.dias_transcurridos;

        // Calcular progreso esperado
        const progresoEsperado = cronograma.dias_transcurridos > 0
            ? (cronograma.dias_transcurridos / diasTotales) * cronograma.total_preguntas_oposicion
            : 0;

        const progresoReal = cronograma.preguntas_dominadas;
        const diferencia = progresoReal - progresoEsperado;
        const diferenciaPorcentual = progresoEsperado > 0
            ? (diferencia / progresoEsperado) * 100
            : 0;

        // Determinar estado
        let estado = 'en_tiempo';
        if (diferenciaPorcentual >= 10) {
            estado = 'adelantado';
        } else if (diferenciaPorcentual <= -10) {
            estado = 'retrasado';
        }

        // Verificar inactividad
        const lastActivityCheck = await client.query(`
            SELECT last_activity
            FROM class_enrollments
            WHERE alumno_id = $1 AND oposicion_id = $2
        `, [alumnoId, oposicionId]);

        if (lastActivityCheck.rows.length > 0) {
            const lastActivity = new Date(lastActivityCheck.rows[0].last_activity);
            const diasInactivo = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));

            if (diasInactivo > 7) {
                estado = 'inactivo';
            }
        }

        // Actualizar cronograma
        await client.query(`
            UPDATE cronograma_alumno
            SET estado = $1,
                diferencia_porcentual = $2,
                updated_at = NOW()
            WHERE id = $3
        `, [estado, diferenciaPorcentual, cronograma.id]);

        await client.query('COMMIT');

        return {
            success: true,
            estado: estado,
            diferencia_porcentual: diferenciaPorcentual,
            progreso_esperado: progresoEsperado,
            progreso_real: progresoReal
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener cronogramas de todos los alumnos de una oposición (para el profesor)
 */
async function obtenerCronogramasOposicion(profesorId, oposicionId) {
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
                u.nickname,
                u.email,
                ca.fecha_objetivo,
                ca.total_preguntas_oposicion,
                ca.preguntas_dominadas,
                ca.porcentaje_progreso,
                ca.estado,
                ca.diferencia_porcentual,
                ce.last_activity,
                (SELECT COUNT(*) FROM cronograma_bloques cb WHERE cb.cronograma_id = ca.id AND cb.habilitado = true) as bloques_habilitados,
                (SELECT COUNT(*) FROM cronograma_bloques cb WHERE cb.cronograma_id = ca.id AND cb.completado = true) as bloques_completados,
                (SELECT COUNT(*) FROM cronograma_bloques cb WHERE cb.cronograma_id = ca.id) as bloques_totales
            FROM cronograma_alumno ca
            JOIN users u ON ca.alumno_id = u.id
            LEFT JOIN class_enrollments ce ON ca.oposicion_id = ce.oposicion_id AND ca.alumno_id = ce.alumno_id
            WHERE ca.oposicion_id = $1
            ORDER BY ca.porcentaje_progreso DESC, u.nickname
        `;

        const result = await pool.query(query, [oposicionId]);

        return {
            success: true,
            cronogramas: result.rows
        };

    } catch (error) {
        throw error;
    }
}

module.exports = {
    generarCronograma,
    obtenerCronogramaAlumno,
    actualizarFechaObjetivo,
    habilitarSiguienteBloque,
    actualizarEstadoCronograma,
    obtenerCronogramasOposicion
};

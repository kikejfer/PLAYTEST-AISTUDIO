const { getPool } = require('../database/connection');

/**
 * CONTROLADOR: Oposiciones
 * Gestión de oposiciones (antes teacher_classes)
 */

/**
 * Crear nueva oposición
 */
async function crearOposicion(profesorId, data) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Generar código único para la oposición
        const codeResult = await client.query('SELECT generate_class_code() as code');
        const codigoAcceso = codeResult.rows[0].code;

        const insertQuery = `
            INSERT INTO oposiciones (
                profesor_id,
                nombre_oposicion,
                codigo_acceso,
                descripcion,
                academic_year,
                fecha_oposicion_sugerida,
                is_active,
                start_date,
                end_date
            ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
            RETURNING *
        `;

        const values = [
            profesorId,
            data.nombre_oposicion,
            codigoAcceso,
            data.descripcion || null,
            data.academic_year || new Date().getFullYear().toString(),
            data.fecha_oposicion_sugerida || null,
            data.start_date || new Date(),
            data.end_date || data.fecha_oposicion_sugerida || null
        ];

        const result = await client.query(insertQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            oposicion: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener oposiciones del profesor
 */
async function obtenerMisOposiciones(profesorId, filters = {}) {
    const pool = getPool();
    try {
        const { is_active = true } = filters;

        const query = `
            SELECT
                o.*,
                COUNT(DISTINCT ce.alumno_id) as alumnos_inscritos,
                COUNT(DISTINCT bt.id) as bloques_creados,
                COALESCE(AVG(ca.porcentaje_progreso), 0) as progreso_promedio,
                MAX(ca.fecha_objetivo) as fecha_objetivo_promedio
            FROM oposiciones o
            LEFT JOIN class_enrollments ce ON o.id = ce.oposicion_id AND ce.enrollment_status = 'active'
            LEFT JOIN bloques_temas bt ON o.id = bt.oposicion_id
            LEFT JOIN cronograma_alumno ca ON o.id = ca.oposicion_id
            WHERE o.profesor_id = $1
            ${is_active !== 'all' ? 'AND o.is_active = $2' : ''}
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;

        const params = is_active !== 'all'
            ? [profesorId, is_active]
            : [profesorId];

        const result = await pool.query(query, params);

        return {
            success: true,
            oposiciones: result.rows
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Obtener detalles de una oposición específica
 */
async function obtenerDetalleOposicion(profesorId, oposicionId) {
    const pool = getPool();
    try {
        const query = `
            SELECT
                o.*,
                COUNT(DISTINCT ce.alumno_id) as alumnos_inscritos,
                COUNT(DISTINCT bt.id) as bloques_creados,
                COALESCE(AVG(ca.porcentaje_progreso), 0) as progreso_promedio,
                json_agg(
                    DISTINCT jsonb_build_object(
                        'id', bt.id,
                        'nombre', bt.nombre,
                        'orden', bt.orden,
                        'total_preguntas', bt.total_preguntas
                    ) ORDER BY bt.orden
                ) FILTER (WHERE bt.id IS NOT NULL) as bloques
            FROM oposiciones o
            LEFT JOIN class_enrollments ce ON o.id = ce.oposicion_id AND ce.enrollment_status = 'active'
            LEFT JOIN bloques_temas bt ON o.id = bt.oposicion_id
            LEFT JOIN cronograma_alumno ca ON o.id = ca.oposicion_id
            WHERE o.id = $1 AND o.profesor_id = $2
            GROUP BY o.id
        `;

        const result = await pool.query(query, [oposicionId, profesorId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Oposición no encontrada o sin permisos'
            };
        }

        return {
            success: true,
            oposicion: result.rows[0]
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Actualizar oposición
 */
async function actualizarOposicion(profesorId, oposicionId, data) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar permisos
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

        const updateQuery = `
            UPDATE oposiciones SET
                nombre_oposicion = COALESCE($1, nombre_oposicion),
                descripcion = COALESCE($2, descripcion),
                fecha_oposicion_sugerida = COALESCE($3, fecha_oposicion_sugerida),
                end_date = COALESCE($4, end_date),
                is_active = COALESCE($5, is_active),
                updated_at = NOW()
            WHERE id = $6 AND profesor_id = $7
            RETURNING *
        `;

        const values = [
            data.nombre_oposicion || null,
            data.descripcion || null,
            data.fecha_oposicion_sugerida || null,
            data.end_date || null,
            data.is_active !== undefined ? data.is_active : null,
            oposicionId,
            profesorId
        ];

        const result = await client.query(updateQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            oposicion: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Desactivar oposición (soft delete)
 */
async function desactivarOposicion(profesorId, oposicionId) {
    const pool = getPool();
    try {
        const query = `
            UPDATE oposiciones
            SET is_active = false, updated_at = NOW()
            WHERE id = $1 AND profesor_id = $2
            RETURNING *
        `;

        const result = await pool.query(query, [oposicionId, profesorId]);

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Oposición no encontrada o sin permisos'
            };
        }

        return {
            success: true,
            message: 'Oposición desactivada exitosamente'
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Inscribir alumno en oposición usando código de acceso
 */
async function inscribirAlumno(alumnoId, codigoAcceso) {
    const pool = getPool();
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que la oposición existe y está activa
        const oposicionQuery = await client.query(
            'SELECT id, nombre_oposicion FROM oposiciones WHERE codigo_acceso = $1 AND is_active = true',
            [codigoAcceso]
        );

        if (oposicionQuery.rows.length === 0) {
            return {
                success: false,
                error: 'Código de acceso inválido o oposición inactiva'
            };
        }

        const oposicionId = oposicionQuery.rows[0].id;

        // Verificar que no esté ya inscrito
        const checkEnrollment = await client.query(
            'SELECT id FROM class_enrollments WHERE oposicion_id = $1 AND alumno_id = $2',
            [oposicionId, alumnoId]
        );

        if (checkEnrollment.rows.length > 0) {
            return {
                success: false,
                error: 'Ya estás inscrito en esta oposición'
            };
        }

        // Inscribir alumno
        const enrollQuery = `
            INSERT INTO class_enrollments (
                oposicion_id,
                alumno_id,
                enrollment_status,
                enrollment_date,
                last_activity
            ) VALUES ($1, $2, 'active', CURRENT_DATE, NOW())
            RETURNING *
        `;

        const enrollResult = await client.query(enrollQuery, [oposicionId, alumnoId]);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Inscripción exitosa',
            oposicion: oposicionQuery.rows[0],
            enrollment: enrollResult.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener alumnos de una oposición
 */
async function obtenerAlumnosOposicion(profesorId, oposicionId, filters = {}) {
    const pool = getPool();
    try {
        // Verificar permisos del profesor
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

        const { estado = 'all' } = filters;

        const query = `
            SELECT
                u.id as alumno_id,
                u.nickname,
                u.email,
                ce.enrollment_date,
                ce.enrollment_status,
                ce.last_activity,
                ca.fecha_objetivo,
                ca.porcentaje_progreso as progreso_global,
                ca.preguntas_dominadas,
                ca.total_preguntas_oposicion,
                ca.estado as estado_cronograma,
                ca.diferencia_porcentual
            FROM class_enrollments ce
            JOIN users u ON ce.alumno_id = u.id
            LEFT JOIN cronograma_alumno ca ON ce.oposicion_id = ca.oposicion_id AND ce.alumno_id = ca.alumno_id
            WHERE ce.oposicion_id = $1
            ${estado !== 'all' ? 'AND ca.estado = $2' : ''}
            ORDER BY ca.porcentaje_progreso DESC, u.nickname ASC
        `;

        const params = estado !== 'all'
            ? [oposicionId, estado]
            : [oposicionId];

        const result = await pool.query(query, params);

        return {
            success: true,
            alumnos: result.rows
        };

    } catch (error) {
        throw error;
    }
}

module.exports = {
    crearOposicion,
    obtenerMisOposiciones,
    obtenerDetalleOposicion,
    actualizarOposicion,
    desactivarOposicion,
    inscribirAlumno,
    obtenerAlumnosOposicion
};

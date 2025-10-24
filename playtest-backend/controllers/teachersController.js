const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Generar código único para la clase
 * Formato: SUBJECT-YEAR-RANDOM (ej: MATH2024-A5F2)
 */
function generateClassCode(subject, academicYear) {
    const subjectCode = subject.substring(0, 4).toUpperCase();
    const year = academicYear || new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${subjectCode}${year}-${random}`;
}

/**
 * Crear nueva clase
 */
async function createClass(teacherId, classData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Generar código único para la clase
        const classCode = generateClassCode(classData.subject, classData.academic_year);

        // Verificar que el código no exista (muy improbable, pero por seguridad)
        const checkCode = await client.query(
            'SELECT id FROM teacher_classes WHERE class_code = $1',
            [classCode]
        );

        if (checkCode.rows.length > 0) {
            // Si existe, generar otro
            const newCode = generateClassCode(classData.subject, classData.academic_year);
            classData.class_code = newCode;
        } else {
            classData.class_code = classCode;
        }

        const insertQuery = `
            INSERT INTO teacher_classes (
                teacher_id,
                class_name,
                class_code,
                subject,
                grade_level,
                academic_year,
                semester,
                max_students,
                class_room,
                start_date,
                end_date,
                is_active,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())
            RETURNING *;
        `;

        const values = [
            teacherId,
            classData.class_name,
            classData.class_code,
            classData.subject,
            classData.grade_level || null,
            classData.academic_year || new Date().getFullYear(),
            classData.semester || null,
            classData.max_students || null,
            classData.class_room || null,
            classData.start_date || null,
            classData.end_date || null
        ];

        const result = await client.query(insertQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            class: result.rows[0]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener clases del profesor
 */
async function getMyClasses(teacherId, filters = {}) {
    const { is_active = true, academic_year = null } = filters;

    let query = `
        SELECT
            tc.*,
            COUNT(DISTINCT ce.student_id) as enrolled_students_count,
            COUNT(DISTINCT ca.block_id) as assigned_blocks_count
        FROM teacher_classes tc
        LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.enrollment_status = 'active'
        LEFT JOIN content_assignments ca ON tc.id = ca.class_id AND ca.is_active = true
        WHERE tc.teacher_id = $1
    `;

    const params = [teacherId];
    let paramIndex = 2;

    if (is_active !== null) {
        query += ` AND tc.is_active = $${paramIndex}`;
        params.push(is_active);
        paramIndex++;
    }

    if (academic_year) {
        query += ` AND tc.academic_year = $${paramIndex}`;
        params.push(academic_year);
        paramIndex++;
    }

    query += `
        GROUP BY tc.id
        ORDER BY tc.created_at DESC;
    `;

    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Obtener detalles de una clase específica
 */
async function getClassById(classId, teacherId) {
    const query = `
        SELECT
            tc.*,
            COUNT(DISTINCT ce.student_id) as enrolled_students_count,
            COUNT(DISTINCT ca.block_id) as assigned_blocks_count
        FROM teacher_classes tc
        LEFT JOIN class_enrollments ce ON tc.id = ce.class_id AND ce.enrollment_status = 'active'
        LEFT JOIN content_assignments ca ON tc.id = ca.class_id AND ca.is_active = true
        WHERE tc.id = $1 AND tc.teacher_id = $2
        GROUP BY tc.id;
    `;

    const result = await pool.query(query, [classId, teacherId]);

    if (result.rows.length === 0) {
        throw new Error('Clase no encontrada o no tienes permisos');
    }

    return result.rows[0];
}

/**
 * Actualizar clase
 */
async function updateClass(classId, teacherId, updateData) {
    // Verificar que la clase pertenece al profesor
    await getClassById(classId, teacherId);

    const allowedFields = [
        'class_name',
        'subject',
        'grade_level',
        'academic_year',
        'semester',
        'max_students',
        'class_room',
        'start_date',
        'end_date',
        'is_active'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
            updates.push(`${key} = $${paramIndex}`);
            values.push(updateData[key]);
            paramIndex++;
        }
    });

    if (updates.length === 0) {
        throw new Error('No hay campos válidos para actualizar');
    }

    values.push(classId);
    values.push(teacherId);

    const query = `
        UPDATE teacher_classes
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex} AND teacher_id = $${paramIndex + 1}
        RETURNING *;
    `;

    const result = await pool.query(query, values);

    return {
        success: true,
        class: result.rows[0]
    };
}

/**
 * Eliminar clase (soft delete)
 */
async function deleteClass(classId, teacherId) {
    // Verificar que la clase pertenece al profesor
    await getClassById(classId, teacherId);

    const query = `
        UPDATE teacher_classes
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND teacher_id = $2
        RETURNING *;
    `;

    const result = await pool.query(query, [classId, teacherId]);

    return {
        success: true,
        message: 'Clase desactivada correctamente',
        class: result.rows[0]
    };
}

/**
 * Asignar bloque a clase
 */
async function assignBlockToClass(classId, teacherId, assignmentData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que la clase pertenece al profesor
        const classCheck = await client.query(
            'SELECT id FROM teacher_classes WHERE id = $1 AND teacher_id = $2',
            [classId, teacherId]
        );

        if (classCheck.rows.length === 0) {
            throw new Error('Clase no encontrada o no tienes permisos');
        }

        // Verificar que el bloque existe y pertenece al profesor
        const blockCheck = await client.query(
            'SELECT id, name FROM blocks WHERE id = $1 AND user_id = $2',
            [assignmentData.block_id, teacherId]
        );

        if (blockCheck.rows.length === 0) {
            throw new Error('Bloque no encontrado o no te pertenece');
        }

        // Verificar si ya existe la asignación
        const existingAssignment = await client.query(
            'SELECT id FROM content_assignments WHERE class_id = $1 AND block_id = $2',
            [classId, assignmentData.block_id]
        );

        if (existingAssignment.rows.length > 0) {
            throw new Error('Este bloque ya está asignado a esta clase');
        }

        // Crear asignación
        const insertQuery = `
            INSERT INTO content_assignments (
                class_id,
                block_id,
                content_type,
                assigned_at,
                due_date,
                instructions,
                is_active
            ) VALUES ($1, $2, $3, NOW(), $4, $5, true)
            RETURNING *;
        `;

        const values = [
            classId,
            assignmentData.block_id,
            assignmentData.content_type || 'homework',
            assignmentData.due_date || null,
            assignmentData.instructions || null
        ];

        const result = await client.query(insertQuery, values);

        await client.query('COMMIT');

        return {
            success: true,
            assignment: result.rows[0],
            block_name: blockCheck.rows[0].name
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener bloques asignados a una clase
 */
async function getClassBlocks(classId, teacherId) {
    // Verificar que la clase pertenece al profesor
    await getClassById(classId, teacherId);

    const query = `
        SELECT
            ca.id as assignment_id,
            ca.assigned_at,
            ca.due_date,
            ca.instructions,
            ca.content_type,
            b.id as block_id,
            b.name as block_name,
            b.description as block_description,
            (SELECT COUNT(*) FROM questions WHERE block_id = b.id) as questions_count,
            COUNT(DISTINCT ulb.user_id) as students_loaded_count
        FROM content_assignments ca
        JOIN blocks b ON ca.block_id = b.id
        LEFT JOIN user_loaded_blocks ulb ON ulb.block_id = b.id
        LEFT JOIN class_enrollments ce ON ce.class_id = ca.class_id AND ce.student_id = ulb.user_id
        WHERE ca.class_id = $1 AND ca.is_active = true
        GROUP BY ca.id, b.id
        ORDER BY ca.assigned_at DESC;
    `;

    const result = await pool.query(query, [classId]);
    return result.rows;
}

/**
 * Remover asignación de bloque
 */
async function removeBlockFromClass(assignmentId, teacherId) {
    const query = `
        UPDATE content_assignments ca
        SET is_active = false
        FROM teacher_classes tc
        WHERE ca.id = $1
          AND ca.class_id = tc.id
          AND tc.teacher_id = $2
        RETURNING ca.*;
    `;

    const result = await pool.query(query, [assignmentId, teacherId]);

    if (result.rows.length === 0) {
        throw new Error('Asignación no encontrada o no tienes permisos');
    }

    return {
        success: true,
        message: 'Bloque desasignado correctamente'
    };
}

/**
 * Obtener estudiantes de una clase
 */
async function getClassStudents(classId, teacherId) {
    // Verificar que la clase pertenece al profesor
    await getClassById(classId, teacherId);

    const query = `
        SELECT
            u.id as student_id,
            u.nickname,
            u.email,
            ce.enrollment_date,
            ce.enrollment_status,
            sap.enrollment_date as academic_profile_date,
            COUNT(DISTINCT ulb.block_id) as blocks_loaded_count,
            COUNT(DISTINCT ap.id) as assignments_completed
        FROM class_enrollments ce
        JOIN users u ON ce.student_id = u.id
        LEFT JOIN student_academic_profiles sap ON sap.student_id = u.id AND sap.class_id = ce.class_id
        LEFT JOIN user_loaded_blocks ulb ON ulb.user_id = u.id
        LEFT JOIN academic_progress ap ON ap.student_id = u.id AND ap.class_id = ce.class_id
        WHERE ce.class_id = $1 AND ce.enrollment_status = 'active'
        GROUP BY u.id, ce.enrollment_date, ce.enrollment_status, sap.enrollment_date
        ORDER BY ce.enrollment_date DESC;
    `;

    const result = await pool.query(query, [classId]);
    return result.rows;
}

/**
 * Obtener progreso de estudiantes en una clase
 */
async function getClassProgress(classId, teacherId) {
    // Verificar que la clase pertenece al profesor
    await getClassById(classId, teacherId);

    const query = `
        SELECT
            u.id as student_id,
            u.nickname,
            b.name as block_name,
            ap.date_started,
            ap.date_completed,
            ap.time_spent_minutes,
            ap.percentage,
            ap.status,
            ap.best_score
        FROM academic_progress ap
        JOIN users u ON ap.student_id = u.id
        JOIN blocks b ON b.id = (
            SELECT block_id FROM content_assignments WHERE id = ap.assignment_id LIMIT 1
        )
        WHERE ap.class_id = $1
        ORDER BY u.nickname, ap.date_started DESC;
    `;

    const result = await pool.query(query, [classId]);
    return result.rows;
}

module.exports = {
    createClass,
    getMyClasses,
    getClassById,
    updateClass,
    deleteClass,
    assignBlockToClass,
    getClassBlocks,
    removeBlockFromClass,
    getClassStudents,
    getClassProgress
};

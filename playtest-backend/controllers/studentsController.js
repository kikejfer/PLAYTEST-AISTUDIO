/**
 * Controller para gestión de estudiantes
 * Maneja inscripciones, clases y bloques asignados
 */

const { Pool } = require('pg');

// Configurar pool de conexiones
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Obtener clases en las que el estudiante está inscrito
 * @param {number} studentId - ID del estudiante
 * @returns {Promise<Array>} Lista de clases
 */
async function getMyClasses(studentId) {
    try {
        const query = `
            SELECT
                tc.id,
                tc.class_name,
                tc.class_code,
                tc.subject,
                tc.grade_level,
                tc.academic_year,
                tc.semester,
                tc.class_room,
                u.nickname as teacher_name,
                ce.enrollment_date,
                ce.enrollment_status
            FROM class_enrollments ce
            JOIN teacher_classes tc ON ce.class_id = tc.id
            JOIN users u ON tc.teacher_id = u.id
            WHERE ce.student_id = $1
              AND ce.enrollment_status = 'active'
              AND tc.is_active = true
            ORDER BY tc.created_at DESC;
        `;

        const result = await pool.query(query, [studentId]);
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo clases del estudiante:', error);
        throw error;
    }
}

/**
 * Inscribir estudiante en una clase mediante código
 * @param {number} studentId - ID del estudiante
 * @param {string} classCode - Código de la clase
 * @returns {Promise<Object>} Información de la inscripción
 */
async function enrollInClass(studentId, classCode) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Buscar la clase por código
        const classQuery = `
            SELECT id, class_name, max_students, teacher_id, end_date
            FROM teacher_classes
            WHERE class_code = $1
              AND is_active = true
              AND (end_date IS NULL OR end_date >= CURRENT_DATE);
        `;

        const classResult = await client.query(classQuery, [classCode.toUpperCase()]);

        if (classResult.rows.length === 0) {
            throw new Error('Código de clase inválido o clase no activa');
        }

        const classData = classResult.rows[0];

        // 2. Verificar si ya está inscrito
        const enrollmentCheck = `
            SELECT id FROM class_enrollments
            WHERE class_id = $1 AND student_id = $2;
        `;

        const existingEnrollment = await client.query(enrollmentCheck, [classData.id, studentId]);

        if (existingEnrollment.rows.length > 0) {
            throw new Error('Ya estás inscrito en esta clase');
        }

        // 3. Verificar límite de estudiantes
        if (classData.max_students) {
            const countQuery = `
                SELECT COUNT(*) as count
                FROM class_enrollments
                WHERE class_id = $1 AND enrollment_status = 'active';
            `;

            const countResult = await client.query(countQuery, [classData.id]);

            if (parseInt(countResult.rows[0].count) >= classData.max_students) {
                throw new Error('La clase ha alcanzado su capacidad máxima');
            }
        }

        // 4. Crear inscripción
        const enrollQuery = `
            INSERT INTO class_enrollments (class_id, student_id, enrollment_status, enrollment_date)
            VALUES ($1, $2, 'active', CURRENT_DATE)
            RETURNING id, enrollment_date;
        `;

        const enrollResult = await client.query(enrollQuery, [classData.id, studentId]);

        // 5. Crear perfil académico del estudiante (opcional, se puede crear después)
        // La tabla no tiene restricción UNIQUE, así que verificamos si ya existe
        const checkProfileQuery = `
            SELECT id FROM student_academic_profiles
            WHERE student_id = $1 AND class_id = $2;
        `;

        const existingProfile = await client.query(checkProfileQuery, [studentId, classData.id]);

        if (existingProfile.rows.length === 0) {
            const profileQuery = `
                INSERT INTO student_academic_profiles (
                    student_id,
                    class_id
                )
                VALUES ($1, $2);
            `;
            await client.query(profileQuery, [studentId, classData.id]);
        }

        await client.query('COMMIT');

        return {
            success: true,
            class_name: classData.class_name,
            class_code: classCode.toUpperCase(),
            enrollment_date: enrollResult.rows[0].enrollment_date
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Obtener bloques asignados a las clases del estudiante
 * @param {number} studentId - ID del estudiante
 * @returns {Promise<Array>} Lista de bloques asignados
 */
async function getAssignedBlocks(studentId) {
    try {
        const query = `
            SELECT DISTINCT
                b.id as block_id,
                b.name as block_name,
                b.description as block_description,
                tc.class_name,
                tc.class_code,
                u.nickname as teacher_name,
                ca.due_date,
                COALESCE(ca.assigned_at, ca.created_at) as assigned_at,
                COALESCE(ca.content_type, ca.assignment_type) as content_type,
                COALESCE(ca.instructions, ca.assignment_name) as instructions,
                (SELECT COUNT(*) FROM questions WHERE block_id = b.id) as questions_count,
                CASE
                    WHEN ulb.id IS NOT NULL THEN true
                    ELSE false
                END as is_loaded,
                ulb.loaded_at,
                CASE
                    WHEN ca.due_date IS NULL THEN 1
                    ELSE 0
                END as due_date_sort
            FROM content_assignments ca
            JOIN teacher_classes tc ON ca.class_id = tc.id
            JOIN users u ON tc.teacher_id = u.id
            JOIN class_enrollments ce ON ce.class_id = tc.id AND ce.student_id = $1
            JOIN blocks b ON b.id = ca.block_id
            LEFT JOIN user_loaded_blocks ulb ON ulb.user_id = $1 AND ulb.block_id = b.id
            WHERE ce.enrollment_status = 'active'
              AND ca.is_active = true
            ORDER BY
                due_date_sort,
                due_date ASC,
                assigned_at DESC;
        `;

        const result = await pool.query(query, [studentId]);
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo bloques asignados:', error);
        throw error;
    }
}

/**
 * Cargar un bloque al perfil del estudiante
 * @param {number} studentId - ID del estudiante
 * @param {number} blockId - ID del bloque
 * @returns {Promise<Object>} Confirmación de carga
 */
async function loadBlock(studentId, blockId) {
    try {
        // 1. Verificar que el bloque existe
        const blockCheck = `
            SELECT id, name FROM blocks WHERE id = $1;
        `;

        const blockResult = await pool.query(blockCheck, [blockId]);

        if (blockResult.rows.length === 0) {
            throw new Error('Bloque no encontrado');
        }

        // 2. Insertar en user_loaded_blocks (o no hacer nada si ya existe)
        const loadQuery = `
            INSERT INTO user_loaded_blocks (user_id, block_id, loaded_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id, block_id) DO UPDATE
            SET loaded_at = NOW()
            RETURNING id, loaded_at;
        `;

        const loadResult = await pool.query(loadQuery, [studentId, blockId]);

        return {
            success: true,
            block_name: blockResult.rows[0].name,
            loaded_at: loadResult.rows[0].loaded_at
        };

    } catch (error) {
        console.error('Error cargando bloque:', error);
        throw error;
    }
}

/**
 * Obtener progreso del estudiante en bloques asignados
 * @param {number} studentId - ID del estudiante
 * @param {number} classId - ID de la clase (opcional)
 * @returns {Promise<Array>} Progreso del estudiante
 */
async function getStudentProgress(studentId, classId = null) {
    try {
        const query = `
            SELECT
                ap.id,
                b.name as block_name,
                tc.class_name,
                ap.date_started,
                ap.date_completed,
                ap.time_spent_minutes,
                ap.percentage,
                ap.status,
                ap.attempts_count,
                ap.best_score
            FROM academic_progress ap
            JOIN content_assignments ca ON ap.assignment_id = ca.id
            JOIN blocks b ON ca.block_id = b.id
            JOIN teacher_classes tc ON ap.class_id = tc.id
            WHERE ap.student_id = $1
              ${classId ? 'AND ap.class_id = $2' : ''}
            ORDER BY ap.date_started DESC;
        `;

        const params = classId ? [studentId, classId] : [studentId];
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo progreso del estudiante:', error);
        throw error;
    }
}

module.exports = {
    getMyClasses,
    enrollInClass,
    getAssignedBlocks,
    loadBlock,
    getStudentProgress
};

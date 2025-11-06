-- ==========================================
-- MIGRACIÓN: Reorganización a Modelo de Oposiciones
-- Fecha: 2025-02-06
-- Descripción: Transformación del panel de profesor de modelo académico tradicional a modelo de oposiciones
-- Cambios principales:
--   1. teacher_classes → oposiciones (con campos simplificados)
--   2. Nuevo: bloques_temas, temas, cronograma_alumno, cronograma_bloques, comentarios_profesor
--   3. Eliminar: attendance_tracking, pedagogical_interventions (guardar en respaldo)
--   4. Simplificar: Eliminar campos innecesarios para oposiciones
-- ==========================================

BEGIN;

-- ==========================================
-- PASO 1: CREAR RESPALDO DE TABLAS QUE SE ELIMINARÁN
-- ==========================================

-- Crear tabla de respaldo para attendance_tracking
CREATE TABLE IF NOT EXISTS _backup_attendance_tracking AS
SELECT * FROM attendance_tracking;

-- Crear tabla de respaldo para pedagogical_interventions
CREATE TABLE IF NOT EXISTS _backup_pedagogical_interventions AS
SELECT * FROM pedagogical_interventions;

RAISE NOTICE '✅ Paso 1 completado: Tablas de respaldo creadas';

-- ==========================================
-- PASO 2: RENOMBRAR Y REESTRUCTURAR teacher_classes → oposiciones
-- ==========================================

-- Renombrar tabla
ALTER TABLE teacher_classes RENAME TO oposiciones;

-- Renombrar columnas para claridad
ALTER TABLE oposiciones RENAME COLUMN class_name TO nombre_oposicion;
ALTER TABLE oposiciones RENAME COLUMN class_code TO codigo_acceso;
ALTER TABLE oposiciones RENAME COLUMN subject TO descripcion;
ALTER TABLE oposiciones RENAME COLUMN teacher_id TO profesor_id;

-- Eliminar columnas innecesarias para oposiciones
ALTER TABLE oposiciones
DROP COLUMN IF EXISTS semester,
DROP COLUMN IF EXISTS class_room,
DROP COLUMN IF EXISTS max_students,
DROP COLUMN IF EXISTS current_students,
DROP COLUMN IF EXISTS meeting_schedule,
DROP COLUMN IF EXISTS grade_level,
DROP COLUMN IF EXISTS curriculum_standards,
DROP COLUMN IF EXISTS learning_objectives,
DROP COLUMN IF EXISTS assessment_criteria;

-- Añadir columna para fecha objetivo sugerida
ALTER TABLE oposiciones
ADD COLUMN IF NOT EXISTS fecha_oposicion_sugerida DATE;

-- Actualizar índices
DROP INDEX IF EXISTS idx_teacher_classes_teacher;
DROP INDEX IF EXISTS idx_teacher_classes_code;
CREATE INDEX IF NOT EXISTS idx_oposiciones_profesor ON oposiciones(profesor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_oposiciones_codigo ON oposiciones(codigo_acceso);

RAISE NOTICE '✅ Paso 2 completado: teacher_classes renombrada a oposiciones';

-- ==========================================
-- PASO 3: ACTUALIZAR class_enrollments (inscripciones en oposiciones)
-- ==========================================

-- Renombrar columna class_id a oposicion_id
ALTER TABLE class_enrollments RENAME COLUMN class_id TO oposicion_id;
ALTER TABLE class_enrollments RENAME COLUMN student_id TO alumno_id;

-- Eliminar columnas innecesarias para oposiciones
ALTER TABLE class_enrollments
DROP COLUMN IF EXISTS previous_grade,
DROP COLUMN IF EXISTS learning_style,
DROP COLUMN IF EXISTS special_needs,
DROP COLUMN IF EXISTS parent_guardian_info,
DROP COLUMN IF EXISTS emergency_contacts,
DROP COLUMN IF EXISTS attendance_rate,
DROP COLUMN IF EXISTS engagement_score;

-- Actualizar índices
DROP INDEX IF EXISTS idx_class_enrollments_class;
DROP INDEX IF EXISTS idx_class_enrollments_student;
CREATE INDEX IF NOT EXISTS idx_class_enrollments_oposicion ON class_enrollments(oposicion_id, enrollment_status);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_alumno ON class_enrollments(alumno_id);

RAISE NOTICE '✅ Paso 3 completado: class_enrollments actualizada';

-- ==========================================
-- PASO 4: CREAR NUEVAS TABLAS DEL MODELO DE OPOSICIONES
-- ==========================================

-- Tabla: bloques_temas (reemplaza la relación directa con blocks)
CREATE TABLE IF NOT EXISTS bloques_temas (
    id SERIAL PRIMARY KEY,
    oposicion_id INTEGER NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL, -- 1, 2, 3... (orden de estudio)
    tiempo_estimado_dias INTEGER DEFAULT 14, -- Días estimados para completar el bloque
    total_preguntas INTEGER DEFAULT 0, -- Calculado automáticamente

    -- Metadatos
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint de orden único por oposición
    UNIQUE(oposicion_id, orden)
);

-- Tabla: temas (subniveles dentro de bloques)
CREATE TABLE IF NOT EXISTS temas (
    id SERIAL PRIMARY KEY,
    bloque_id INTEGER NOT NULL REFERENCES bloques_temas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL, -- Orden dentro del bloque
    num_preguntas INTEGER DEFAULT 0, -- Calculado automáticamente

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint de orden único por bloque
    UNIQUE(bloque_id, orden)
);

-- Tabla: cronograma_alumno (cronograma personalizado por alumno)
CREATE TABLE IF NOT EXISTS cronograma_alumno (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    oposicion_id INTEGER NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,

    -- Fecha objetivo del alumno
    fecha_objetivo DATE NOT NULL,
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,

    -- Progreso global
    total_preguntas_oposicion INTEGER DEFAULT 0,
    preguntas_dominadas INTEGER DEFAULT 0,
    porcentaje_progreso DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_preguntas_oposicion > 0
            THEN (preguntas_dominadas::DECIMAL / total_preguntas_oposicion) * 100
            ELSE 0
        END
    ) STORED,

    -- Estado del cronograma
    estado VARCHAR(20) DEFAULT 'en_tiempo', -- 'adelantado', 'en_tiempo', 'retrasado', 'inactivo'
    diferencia_porcentual DECIMAL(5,2) DEFAULT 0, -- % de adelanto/retraso

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint único por alumno-oposición
    UNIQUE(alumno_id, oposicion_id)
);

-- Tabla: cronograma_bloques (cronograma de bloques por alumno)
CREATE TABLE IF NOT EXISTS cronograma_bloques (
    id SERIAL PRIMARY KEY,
    cronograma_id INTEGER NOT NULL REFERENCES cronograma_alumno(id) ON DELETE CASCADE,
    bloque_id INTEGER NOT NULL REFERENCES bloques_temas(id) ON DELETE CASCADE,

    -- Fechas previstas (calculadas automáticamente)
    fecha_inicio_prevista DATE NOT NULL,
    fecha_fin_prevista DATE NOT NULL,

    -- Fechas reales
    fecha_inicio_real DATE,
    fecha_fin_real DATE,

    -- Estado del bloque
    habilitado BOOLEAN DEFAULT FALSE,
    completado BOOLEAN DEFAULT FALSE,

    -- Progreso en el bloque
    total_preguntas_bloque INTEGER DEFAULT 0,
    preguntas_dominadas INTEGER DEFAULT 0,
    porcentaje_progreso DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN total_preguntas_bloque > 0
            THEN (preguntas_dominadas::DECIMAL / total_preguntas_bloque) * 100
            ELSE 0
        END
    ) STORED,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint único por cronograma-bloque
    UNIQUE(cronograma_id, bloque_id)
);

-- Tabla: comentarios_profesor (comentarios por bloque/alumno)
CREATE TABLE IF NOT EXISTS comentarios_profesor (
    id SERIAL PRIMARY KEY,
    profesor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alumno_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bloque_id INTEGER NOT NULL REFERENCES bloques_temas(id) ON DELETE CASCADE,

    comentario TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla: dominio_preguntas (rastrea qué preguntas ha dominado cada alumno)
CREATE TABLE IF NOT EXISTS dominio_preguntas (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pregunta_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    -- Historial de intentos
    intentos_totales INTEGER DEFAULT 0,
    intentos_correctos INTEGER DEFAULT 0,
    intentos_incorrectos INTEGER DEFAULT 0,

    -- Últimos 5 intentos (para determinar dominio)
    ultimos_intentos BOOLEAN[] DEFAULT ARRAY[]::BOOLEAN[],

    -- Estado de dominio (>=80% en últimos 5 intentos)
    dominada BOOLEAN DEFAULT FALSE,
    porcentaje_acierto DECIMAL(5,2) DEFAULT 0,

    -- Timestamps
    ultimo_intento TIMESTAMP,
    primera_vez_dominada TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraint único por alumno-pregunta
    UNIQUE(alumno_id, pregunta_id)
);

RAISE NOTICE '✅ Paso 4 completado: Nuevas tablas creadas';

-- ==========================================
-- PASO 5: ACTUALIZAR TABLA questions PARA LINKEAR CON TEMAS
-- ==========================================

-- Añadir columna tema_id a questions
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS tema_id INTEGER REFERENCES temas(id) ON DELETE SET NULL;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_questions_tema ON questions(tema_id);

RAISE NOTICE '✅ Paso 5 completado: questions actualizada con tema_id';

-- ==========================================
-- PASO 6: CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ==========================================

-- Índices para bloques_temas
CREATE INDEX IF NOT EXISTS idx_bloques_temas_oposicion ON bloques_temas(oposicion_id, orden);

-- Índices para temas
CREATE INDEX IF NOT EXISTS idx_temas_bloque ON temas(bloque_id, orden);

-- Índices para cronograma_alumno
CREATE INDEX IF NOT EXISTS idx_cronograma_alumno_alumno ON cronograma_alumno(alumno_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_alumno_oposicion ON cronograma_alumno(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_alumno_estado ON cronograma_alumno(estado);

-- Índices para cronograma_bloques
CREATE INDEX IF NOT EXISTS idx_cronograma_bloques_cronograma ON cronograma_bloques(cronograma_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_bloques_bloque ON cronograma_bloques(bloque_id);
CREATE INDEX IF NOT EXISTS idx_cronograma_bloques_habilitado ON cronograma_bloques(habilitado);

-- Índices para comentarios_profesor
CREATE INDEX IF NOT EXISTS idx_comentarios_profesor_alumno ON comentarios_profesor(alumno_id, bloque_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_profesor_profesor ON comentarios_profesor(profesor_id);

-- Índices para dominio_preguntas
CREATE INDEX IF NOT EXISTS idx_dominio_preguntas_alumno ON dominio_preguntas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_dominio_preguntas_pregunta ON dominio_preguntas(pregunta_id);
CREATE INDEX IF NOT EXISTS idx_dominio_preguntas_dominada ON dominio_preguntas(alumno_id, dominada);

RAISE NOTICE '✅ Paso 6 completado: Índices creados';

-- ==========================================
-- PASO 7: ACTUALIZAR TABLAS RELACIONADAS
-- ==========================================

-- Actualizar student_academic_profiles (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_academic_profiles') THEN
        ALTER TABLE student_academic_profiles RENAME COLUMN class_id TO oposicion_id;
        DROP INDEX IF EXISTS idx_student_profiles_student_class;
        CREATE INDEX IF NOT EXISTS idx_student_profiles_student_oposicion ON student_academic_profiles(student_id, oposicion_id);
        RAISE NOTICE '  - student_academic_profiles actualizada';
    END IF;
END $$;

-- Actualizar academic_schedules (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'academic_schedules') THEN
        ALTER TABLE academic_schedules RENAME COLUMN class_id TO oposicion_id;
        DROP INDEX IF EXISTS idx_academic_schedules_class;
        CREATE INDEX IF NOT EXISTS idx_academic_schedules_oposicion ON academic_schedules(oposicion_id, is_active);
        RAISE NOTICE '  - academic_schedules actualizada';
    END IF;
END $$;

-- Actualizar content_assignments (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_assignments') THEN
        ALTER TABLE content_assignments RENAME COLUMN class_id TO oposicion_id;
        DROP INDEX IF EXISTS idx_content_assignments_class;
        CREATE INDEX IF NOT EXISTS idx_content_assignments_oposicion ON content_assignments(oposicion_id, due_date);
        RAISE NOTICE '  - content_assignments actualizada';
    END IF;
END $$;

-- Actualizar academic_progress (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'academic_progress') THEN
        ALTER TABLE academic_progress RENAME COLUMN class_id TO oposicion_id;
        ALTER TABLE academic_progress RENAME COLUMN student_id TO alumno_id;
        DROP INDEX IF EXISTS idx_academic_progress_student;
        CREATE INDEX IF NOT EXISTS idx_academic_progress_alumno ON academic_progress(alumno_id, oposicion_id);
        RAISE NOTICE '  - academic_progress actualizada';
    END IF;
END $$;

RAISE NOTICE '✅ Paso 7 completado: Tablas relacionadas actualizadas';

-- ==========================================
-- PASO 8: ELIMINAR TABLAS INNECESARIAS (RESPALDADAS)
-- ==========================================

DROP TABLE IF EXISTS attendance_tracking CASCADE;
DROP TABLE IF EXISTS pedagogical_interventions CASCADE;

-- Nota: Las tablas educational_tournaments, educational_resources pueden mantenerse
-- para funcionalidades futuras de gamificación

RAISE NOTICE '✅ Paso 8 completado: Tablas innecesarias eliminadas (respaldadas)';

-- ==========================================
-- PASO 9: CREAR FUNCIONES DE UTILIDAD
-- ==========================================

-- Función: Calcular total de preguntas de un bloque
CREATE OR REPLACE FUNCTION calcular_total_preguntas_bloque(bloque_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COUNT(q.id) INTO total
    FROM questions q
    JOIN temas t ON q.tema_id = t.id
    WHERE t.bloque_id = bloque_id_param;

    UPDATE bloques_temas
    SET total_preguntas = total
    WHERE id = bloque_id_param;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Función: Calcular total de preguntas de un tema
CREATE OR REPLACE FUNCTION calcular_total_preguntas_tema(tema_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COUNT(id) INTO total
    FROM questions
    WHERE tema_id = tema_id_param;

    UPDATE temas
    SET num_preguntas = total
    WHERE id = tema_id_param;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Función: Generar cronograma automático para un alumno
CREATE OR REPLACE FUNCTION generar_cronograma_alumno(
    alumno_id_param INTEGER,
    oposicion_id_param INTEGER,
    fecha_objetivo_param DATE
)
RETURNS INTEGER AS $$
DECLARE
    cronograma_id INTEGER;
    bloque_record RECORD;
    fecha_inicio DATE;
    fecha_fin DATE;
    dias_totales INTEGER;
    dias_acumulados INTEGER := 0;
    total_dias_bloques INTEGER;
BEGIN
    -- Calcular días disponibles
    dias_totales := fecha_objetivo_param - CURRENT_DATE;

    IF dias_totales <= 0 THEN
        RAISE EXCEPTION 'La fecha objetivo debe ser futura';
    END IF;

    -- Calcular total de días estimados de todos los bloques
    SELECT SUM(tiempo_estimado_dias) INTO total_dias_bloques
    FROM bloques_temas
    WHERE oposicion_id = oposicion_id_param;

    -- Crear cronograma del alumno
    INSERT INTO cronograma_alumno (alumno_id, oposicion_id, fecha_objetivo)
    VALUES (alumno_id_param, oposicion_id_param, fecha_objetivo_param)
    RETURNING id INTO cronograma_id;

    -- Crear cronograma de bloques
    fecha_inicio := CURRENT_DATE;

    FOR bloque_record IN
        SELECT * FROM bloques_temas
        WHERE oposicion_id = oposicion_id_param
        ORDER BY orden ASC
    LOOP
        -- Calcular fecha fin proporcional
        fecha_fin := fecha_inicio + (
            (bloque_record.tiempo_estimado_dias::DECIMAL / total_dias_bloques) * dias_totales
        )::INTEGER;

        -- Insertar cronograma del bloque
        INSERT INTO cronograma_bloques (
            cronograma_id,
            bloque_id,
            fecha_inicio_prevista,
            fecha_fin_prevista,
            total_preguntas_bloque,
            habilitado
        )
        VALUES (
            cronograma_id,
            bloque_record.id,
            fecha_inicio,
            fecha_fin,
            bloque_record.total_preguntas,
            CASE WHEN bloque_record.orden = 1 THEN TRUE ELSE FALSE END -- Solo habilitar el primero
        );

        -- Actualizar fecha de inicio para el siguiente bloque
        fecha_inicio := fecha_fin + 1;
    END LOOP;

    RETURN cronograma_id;
END;
$$ LANGUAGE plpgsql;

-- Función: Actualizar dominio de pregunta
CREATE OR REPLACE FUNCTION actualizar_dominio_pregunta(
    alumno_id_param INTEGER,
    pregunta_id_param INTEGER,
    fue_correcta BOOLEAN
)
RETURNS VOID AS $$
DECLARE
    ultimos BOOLEAN[];
    nuevos_ultimos BOOLEAN[];
    correctos INTEGER;
BEGIN
    -- Insertar o actualizar registro
    INSERT INTO dominio_preguntas (alumno_id, pregunta_id, ultimos_intentos, intentos_totales, ultimo_intento)
    VALUES (alumno_id_param, pregunta_id_param, ARRAY[fue_correcta], 1, NOW())
    ON CONFLICT (alumno_id, pregunta_id) DO UPDATE
    SET
        ultimos_intentos = (
            SELECT CASE
                WHEN array_length(dominio_preguntas.ultimos_intentos, 1) >= 5
                THEN dominio_preguntas.ultimos_intentos[2:5] || ARRAY[fue_correcta]
                ELSE dominio_preguntas.ultimos_intentos || ARRAY[fue_correcta]
            END
        ),
        intentos_totales = dominio_preguntas.intentos_totales + 1,
        intentos_correctos = dominio_preguntas.intentos_correctos + CASE WHEN fue_correcta THEN 1 ELSE 0 END,
        intentos_incorrectos = dominio_preguntas.intentos_incorrectos + CASE WHEN fue_correcta THEN 0 ELSE 1 END,
        ultimo_intento = NOW();

    -- Calcular dominio (>=80% en últimos 5 intentos)
    SELECT ultimos_intentos INTO ultimos
    FROM dominio_preguntas
    WHERE alumno_id = alumno_id_param AND pregunta_id = pregunta_id_param;

    IF array_length(ultimos, 1) >= 5 THEN
        correctos := (
            SELECT COUNT(*)
            FROM unnest(ultimos[array_length(ultimos, 1) - 4 : array_length(ultimos, 1)]) AS intento
            WHERE intento = TRUE
        );

        UPDATE dominio_preguntas
        SET
            dominada = (correctos::DECIMAL / 5) >= 0.8,
            porcentaje_acierto = (correctos::DECIMAL / 5) * 100,
            primera_vez_dominada = CASE
                WHEN dominada = FALSE AND (correctos::DECIMAL / 5) >= 0.8 THEN NOW()
                ELSE primera_vez_dominada
            END
        WHERE alumno_id = alumno_id_param AND pregunta_id = pregunta_id_param;
    END IF;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE '✅ Paso 9 completado: Funciones de utilidad creadas';

-- ==========================================
-- PASO 10: CREAR TRIGGERS
-- ==========================================

-- Trigger: Actualizar updated_at en tablas nuevas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a nuevas tablas
DROP TRIGGER IF EXISTS trigger_update_bloques_temas_updated_at ON bloques_temas;
CREATE TRIGGER trigger_update_bloques_temas_updated_at
    BEFORE UPDATE ON bloques_temas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_temas_updated_at ON temas;
CREATE TRIGGER trigger_update_temas_updated_at
    BEFORE UPDATE ON temas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_cronograma_alumno_updated_at ON cronograma_alumno;
CREATE TRIGGER trigger_update_cronograma_alumno_updated_at
    BEFORE UPDATE ON cronograma_alumno
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_cronograma_bloques_updated_at ON cronograma_bloques;
CREATE TRIGGER trigger_update_cronograma_bloques_updated_at
    BEFORE UPDATE ON cronograma_bloques
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_comentarios_profesor_updated_at ON comentarios_profesor;
CREATE TRIGGER trigger_update_comentarios_profesor_updated_at
    BEFORE UPDATE ON comentarios_profesor
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_dominio_preguntas_updated_at ON dominio_preguntas;
CREATE TRIGGER trigger_update_dominio_preguntas_updated_at
    BEFORE UPDATE ON dominio_preguntas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE '✅ Paso 10 completado: Triggers creados';

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================

DO $$
DECLARE
    oposiciones_count INTEGER;
    bloques_count INTEGER;
    temas_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO oposiciones_count FROM oposiciones;
    SELECT COUNT(*) INTO bloques_count FROM bloques_temas;
    SELECT COUNT(*) INTO temas_count FROM temas;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Resumen:';
    RAISE NOTICE '  - Oposiciones: %', oposiciones_count;
    RAISE NOTICE '  - Bloques de temas: %', bloques_count;
    RAISE NOTICE '  - Temas: %', temas_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Tablas respaldadas:';
    RAISE NOTICE '  - _backup_attendance_tracking';
    RAISE NOTICE '  - _backup_pedagogical_interventions';
    RAISE NOTICE '';
    RAISE NOTICE 'Nuevas tablas creadas:';
    RAISE NOTICE '  - bloques_temas';
    RAISE NOTICE '  - temas';
    RAISE NOTICE '  - cronograma_alumno';
    RAISE NOTICE '  - cronograma_bloques';
    RAISE NOTICE '  - comentarios_profesor';
    RAISE NOTICE '  - dominio_preguntas';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

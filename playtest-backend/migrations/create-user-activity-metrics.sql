-- =====================================================
-- SISTEMA DE MÉTRICAS DE ACTIVIDAD DE USUARIOS
-- =====================================================
-- Descripción: Tabla para rastrear la actividad de usuarios
-- Usado por: Sistema de misiones diarias, analytics, engagement
-- =====================================================

-- Tabla principal de métricas de actividad
CREATE TABLE IF NOT EXISTS user_activity_metrics (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    last_activity TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    total_sessions INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    total_time_spent_minutes INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_streak_date DATE,
    total_logins INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_user_activity_last_activity
    ON user_activity_metrics(last_activity);

CREATE INDEX IF NOT EXISTS idx_user_activity_current_streak
    ON user_activity_metrics(current_streak_days DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_last_login
    ON user_activity_metrics(last_login);

-- =====================================================
-- FUNCIÓN: Actualizar actividad de usuario
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_activity(p_user_id INTEGER)
RETURNS void AS $$
BEGIN
    INSERT INTO user_activity_metrics (
        user_id,
        last_activity,
        total_sessions
    ) VALUES (
        p_user_id,
        NOW(),
        1
    )
    ON CONFLICT (user_id) DO UPDATE SET
        last_activity = NOW(),
        total_sessions = user_activity_metrics.total_sessions + 1,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Registrar login de usuario
-- =====================================================
CREATE OR REPLACE FUNCTION record_user_login(p_user_id INTEGER)
RETURNS void AS $$
DECLARE
    v_last_streak_date DATE;
    v_current_streak INTEGER;
BEGIN
    -- Obtener datos actuales
    SELECT last_streak_date, current_streak_days
    INTO v_last_streak_date, v_current_streak
    FROM user_activity_metrics
    WHERE user_id = p_user_id;

    -- Si no existe registro, crear uno nuevo
    IF v_last_streak_date IS NULL THEN
        INSERT INTO user_activity_metrics (
            user_id,
            last_login,
            last_activity,
            total_logins,
            current_streak_days,
            longest_streak_days,
            last_streak_date
        ) VALUES (
            p_user_id,
            NOW(),
            NOW(),
            1,
            1,
            1,
            CURRENT_DATE
        );
        RETURN;
    END IF;

    -- Calcular nueva racha
    IF v_last_streak_date = CURRENT_DATE THEN
        -- Ya se logueó hoy, no incrementar racha
        v_current_streak := v_current_streak;
    ELSIF v_last_streak_date = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Login consecutivo, incrementar racha
        v_current_streak := v_current_streak + 1;
    ELSE
        -- Racha rota, reiniciar
        v_current_streak := 1;
    END IF;

    -- Actualizar registro
    UPDATE user_activity_metrics SET
        last_login = NOW(),
        last_activity = NOW(),
        total_logins = total_logins + 1,
        current_streak_days = v_current_streak,
        longest_streak_days = GREATEST(longest_streak_days, v_current_streak),
        last_streak_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Incrementar preguntas respondidas
-- =====================================================
CREATE OR REPLACE FUNCTION increment_questions_answered(
    p_user_id INTEGER,
    p_questions_count INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_activity_metrics (
        user_id,
        total_questions_answered,
        last_activity
    ) VALUES (
        p_user_id,
        p_questions_count,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_questions_answered = user_activity_metrics.total_questions_answered + p_questions_count,
        last_activity = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Incrementar tiempo de estudio
-- =====================================================
CREATE OR REPLACE FUNCTION increment_study_time(
    p_user_id INTEGER,
    p_minutes INTEGER
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_activity_metrics (
        user_id,
        total_time_spent_minutes,
        last_activity
    ) VALUES (
        p_user_id,
        p_minutes,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        total_time_spent_minutes = user_activity_metrics.total_time_spent_minutes + p_minutes,
        last_activity = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INICIALIZAR MÉTRICAS PARA USUARIOS EXISTENTES
-- =====================================================
-- Crear registros iniciales para usuarios que aún no tienen métricas
INSERT INTO user_activity_metrics (user_id, last_activity, total_sessions)
SELECT id, NOW(), 0
FROM users
WHERE id NOT IN (SELECT user_id FROM user_activity_metrics)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_user_count INTEGER;
BEGIN
    -- Verificar tabla creada
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'user_activity_metrics';

    -- Verificar funciones creadas
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN (
        'update_user_activity',
        'record_user_login',
        'increment_questions_answered',
        'increment_study_time'
    );

    -- Verificar usuarios inicializados
    SELECT COUNT(*) INTO v_user_count
    FROM user_activity_metrics;

    RAISE NOTICE '✅ Tabla user_activity_metrics: %',
        CASE WHEN v_table_count = 1 THEN 'CREADA' ELSE 'ERROR' END;
    RAISE NOTICE '✅ Funciones de actividad: % de 4 creadas', v_function_count;
    RAISE NOTICE '✅ Usuarios inicializados: %', v_user_count;
END $$;

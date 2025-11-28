-- =====================================================
-- SISTEMA DE MISIONES DIARIAS AUTOMÁTICAS
-- =====================================================
-- Propósito: Generar engagement diario con recompensas
-- Impacto: Mejora retención y crea hábito de estudio
-- =====================================================

-- Tabla de definiciones de misiones (plantillas)
CREATE TABLE IF NOT EXISTS daily_quest_templates (
    id SERIAL PRIMARY KEY,
    quest_code VARCHAR(50) UNIQUE NOT NULL,
    quest_name VARCHAR(200) NOT NULL,
    quest_description TEXT NOT NULL,
    quest_type VARCHAR(50) NOT NULL CHECK (quest_type IN (
        'answer_questions',      -- Responder X preguntas
        'correct_streak',        -- X respuestas correctas seguidas
        'complete_session',      -- Completar X sesiones
        'play_game_mode',       -- Jugar modo específico
        'spend_time',           -- Pasar X minutos estudiando
        'improve_accuracy',     -- Mejorar % de acierto
        'master_questions',     -- Dominar X preguntas nuevas
        'daily_login'           -- Login diario
    )),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    target_value INTEGER NOT NULL,  -- Objetivo a alcanzar
    reward_luminarias INTEGER NOT NULL,
    bonus_luminarias INTEGER DEFAULT 0,  -- Bonus por completar rápido
    bonus_condition_hours INTEGER,  -- Horas límite para bonus
    icon VARCHAR(50) DEFAULT '🎯',
    color VARCHAR(20) DEFAULT '#4CAF50',
    is_active BOOLEAN DEFAULT TRUE,
    weight INTEGER DEFAULT 1,  -- Probabilidad de selección (1-10)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de misiones activas por usuario
CREATE TABLE IF NOT EXISTS user_daily_quests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES daily_quest_templates(id) ON DELETE CASCADE,
    quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_value INTEGER NOT NULL,
    current_progress INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    bonus_earned BOOLEAN DEFAULT FALSE,
    reward_claimed BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, template_id, quest_date)
);

-- Tabla de progreso de misiones (tracking detallado)
CREATE TABLE IF NOT EXISTS daily_quest_progress (
    id SERIAL PRIMARY KEY,
    user_quest_id INTEGER NOT NULL REFERENCES user_daily_quests(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB NOT NULL,
    progress_increment INTEGER DEFAULT 1,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Tabla de estadísticas de misiones
CREATE TABLE IF NOT EXISTS daily_quest_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_quests_completed INTEGER DEFAULT 0,
    total_quests_failed INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,  -- Días consecutivos completando misiones
    longest_streak_days INTEGER DEFAULT 0,
    total_luminarias_earned INTEGER DEFAULT 0,
    total_bonus_earned INTEGER DEFAULT 0,
    last_completion_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_daily_quests_user_date ON user_daily_quests(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_quests_status ON user_daily_quests(status);
CREATE INDEX IF NOT EXISTS idx_daily_quest_progress_user_quest ON daily_quest_progress(user_quest_id);
CREATE INDEX IF NOT EXISTS idx_daily_quest_stats_user ON daily_quest_stats(user_id);

-- =====================================================
-- FUNCIONES Y TRIGGERS
-- =====================================================

-- Función para actualizar progreso de misión
CREATE OR REPLACE FUNCTION update_daily_quest_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar current_progress
    IF NEW.current_progress >= NEW.target_value AND OLD.current_progress < NEW.target_value THEN
        -- Misión completada
        NEW.status = 'completed';
        NEW.completed_at = NOW();

        -- Verificar si califica para bonus
        IF (SELECT bonus_condition_hours FROM daily_quest_templates WHERE id = NEW.template_id) IS NOT NULL THEN
            IF (NOW() - NEW.started_at) <= (SELECT bonus_condition_hours FROM daily_quest_templates WHERE id = NEW.template_id) * INTERVAL '1 hour' THEN
                NEW.bonus_earned = TRUE;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_quest_progress
BEFORE UPDATE OF current_progress ON user_daily_quests
FOR EACH ROW
EXECUTE FUNCTION update_daily_quest_progress();

-- Función para reclamar recompensa
CREATE OR REPLACE FUNCTION claim_daily_quest_reward(
    p_user_quest_id INTEGER
)
RETURNS TABLE(
    success BOOLEAN,
    luminarias_earned INTEGER,
    bonus_earned INTEGER,
    message TEXT
) AS $$
DECLARE
    v_user_id INTEGER;
    v_template_id INTEGER;
    v_reward INTEGER;
    v_bonus INTEGER := 0;
    v_total INTEGER;
    v_bonus_earned BOOLEAN;
    v_quest_date DATE;
BEGIN
    -- Obtener datos de la misión
    SELECT uq.user_id, uq.template_id, t.reward_luminarias, t.bonus_luminarias, uq.bonus_earned, uq.quest_date
    INTO v_user_id, v_template_id, v_reward, v_bonus, v_bonus_earned, v_quest_date
    FROM user_daily_quests uq
    JOIN daily_quest_templates t ON t.id = uq.template_id
    WHERE uq.id = p_user_quest_id AND uq.status = 'completed' AND uq.reward_claimed = FALSE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Misión no encontrada o recompensa ya reclamada'::TEXT;
        RETURN;
    END IF;

    -- Calcular bonus si aplica
    IF v_bonus_earned THEN
        v_total := v_reward + v_bonus;
    ELSE
        v_total := v_reward;
        v_bonus := 0;
    END IF;

    -- Procesar transacción de Luminarias
    PERFORM process_luminarias_transaction(
        v_user_id,
        v_total,
        'earn',
        'user',
        'engagement',
        'daily_quest',
        'daily_quest_completion',
        jsonb_build_object(
            'quest_id', p_user_quest_id,
            'template_id', v_template_id,
            'bonus_earned', v_bonus_earned
        )
    );

    -- Marcar como reclamada
    UPDATE user_daily_quests
    SET reward_claimed = TRUE
    WHERE id = p_user_quest_id;

    -- Actualizar estadísticas del usuario
    INSERT INTO daily_quest_stats (user_id, total_quests_completed, total_luminarias_earned, total_bonus_earned, last_completion_date)
    VALUES (v_user_id, 1, v_reward, v_bonus, v_quest_date)
    ON CONFLICT (user_id) DO UPDATE SET
        total_quests_completed = daily_quest_stats.total_quests_completed + 1,
        total_luminarias_earned = daily_quest_stats.total_luminarias_earned + v_reward,
        total_bonus_earned = daily_quest_stats.total_bonus_earned + v_bonus,
        last_completion_date = v_quest_date,
        updated_at = NOW();

    -- Actualizar racha
    UPDATE daily_quest_stats
    SET
        current_streak_days = CASE
            WHEN last_completion_date = v_quest_date - INTERVAL '1 day' THEN current_streak_days + 1
            WHEN last_completion_date = v_quest_date THEN current_streak_days
            ELSE 1
        END,
        longest_streak_days = GREATEST(
            longest_streak_days,
            CASE
                WHEN last_completion_date = v_quest_date - INTERVAL '1 day' THEN current_streak_days + 1
                ELSE 1
            END
        )
    WHERE user_id = v_user_id;

    RETURN QUERY SELECT TRUE, v_reward, v_bonus, 'Recompensa reclamada con éxito'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Función para expirar misiones antiguas
CREATE OR REPLACE FUNCTION expire_old_daily_quests()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE user_daily_quests
    SET status = 'expired'
    WHERE status = 'active'
    AND quest_date < CURRENT_DATE;

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    -- Actualizar estadísticas de quests fallidos
    WITH expired_quests AS (
        SELECT user_id, COUNT(*) as failed_count
        FROM user_daily_quests
        WHERE status = 'expired'
        AND quest_date = CURRENT_DATE - INTERVAL '1 day'
        GROUP BY user_id
    )
    INSERT INTO daily_quest_stats (user_id, total_quests_failed, current_streak_days)
    SELECT user_id, failed_count, 0
    FROM expired_quests
    ON CONFLICT (user_id) DO UPDATE SET
        total_quests_failed = daily_quest_stats.total_quests_failed + EXCLUDED.total_quests_failed,
        current_streak_days = 0,
        updated_at = NOW();

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATOS INICIALES: PLANTILLAS DE MISIONES
-- =====================================================

INSERT INTO daily_quest_templates (quest_code, quest_name, quest_description, quest_type, difficulty, target_value, reward_luminarias, bonus_luminarias, bonus_condition_hours, icon, color, weight) VALUES

-- MISIONES FÁCILES (weight alto = más probable)
('daily_login', 'Inicio de Sesión Diario', 'Inicia sesión en LUMIQUIZ hoy', 'daily_login', 'easy', 1, 20, 10, 2, '🌅', '#4CAF50', 10),
('answer_5', 'Calentamiento Mental', 'Responde correctamente 5 preguntas', 'answer_questions', 'easy', 5, 30, 15, 3, '🧠', '#2196F3', 8),
('complete_1_session', 'Primera Sesión', 'Completa 1 sesión de estudio', 'complete_session', 'easy', 1, 25, 10, 4, '📚', '#00BCD4', 8),
('streak_3', 'Mini Racha', 'Acierta 3 preguntas seguidas', 'correct_streak', 'easy', 3, 35, 15, 2, '🔥', '#FF9800', 7),

-- MISIONES MEDIAS
('answer_10', 'Estudiante Dedicado', 'Responde correctamente 10 preguntas', 'answer_questions', 'medium', 10, 50, 25, 4, '📖', '#2196F3', 6),
('complete_2_sessions', 'Doble Sesión', 'Completa 2 sesiones de estudio', 'complete_session', 'medium', 2, 60, 30, 6, '📚', '#00BCD4', 5),
('streak_5', 'Racha de Fuego', 'Acierta 5 preguntas seguidas', 'correct_streak', 'medium', 5, 70, 35, 3, '🔥', '#FF5722', 5),
('spend_15min', 'Cuarto de Hora', 'Estudia durante 15 minutos', 'spend_time', 'medium', 15, 45, 20, 5, '⏰', '#9C27B0', 6),
('master_3', 'Dominio Inicial', 'Domina 3 preguntas nuevas', 'master_questions', 'medium', 3, 55, 25, 5, '⭐', '#FFC107', 4),

-- MISIONES DIFÍCILES (weight bajo = menos frecuente pero mayor recompensa)
('answer_20', 'Maratonista Mental', 'Responde correctamente 20 preguntas', 'answer_questions', 'hard', 20, 100, 50, 6, '🏃', '#2196F3', 3),
('complete_3_sessions', 'Triple Jornada', 'Completa 3 sesiones de estudio', 'complete_session', 'hard', 3, 120, 60, 8, '📚', '#00BCD4', 2),
('streak_10', 'Racha Perfecta', 'Acierta 10 preguntas seguidas', 'correct_streak', 'hard', 10, 150, 75, 4, '🔥', '#F44336', 3),
('spend_30min', 'Media Hora Productiva', 'Estudia durante 30 minutos', 'spend_time', 'hard', 30, 90, 45, 7, '⏰', '#673AB7', 3),
('master_5', 'Maestría Avanzada', 'Domina 5 preguntas nuevas', 'master_questions', 'hard', 5, 110, 55, 6, '⭐', '#FF9800', 2),

-- MISIONES ESPECIALES (aparecen ocasionalmente)
('play_duel', 'Duelo del Día', 'Juega 1 partida en modo Duelo', 'play_game_mode', 'medium', 1, 60, 30, 4, '⚔️', '#E91E63', 4),
('play_exam', 'Examen de Práctica', 'Completa 1 examen simulado', 'play_game_mode', 'hard', 1, 100, 50, 5, '📝', '#3F51B5', 2),
('improve_accuracy', 'Superación Personal', 'Mejora tu % de acierto en 5 puntos', 'improve_accuracy', 'hard', 5, 80, 40, 8, '📈', '#4CAF50', 3)

ON CONFLICT (quest_code) DO NOTHING;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE daily_quest_templates IS 'Plantillas de misiones diarias para generar engagement';
COMMENT ON TABLE user_daily_quests IS 'Misiones activas asignadas a usuarios cada día';
COMMENT ON TABLE daily_quest_progress IS 'Tracking detallado de progreso en misiones';
COMMENT ON TABLE daily_quest_stats IS 'Estadísticas acumuladas de misiones por usuario';

COMMENT ON FUNCTION claim_daily_quest_reward IS 'Procesa la recompensa de una misión completada y actualiza estadísticas';
COMMENT ON FUNCTION expire_old_daily_quests IS 'Marca como expiradas las misiones del día anterior no completadas';

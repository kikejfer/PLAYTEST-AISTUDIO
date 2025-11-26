-- =====================================================
-- MIGRACIÓN COMPLETA - NUEVAS FEATURES LUMIQUIZ
-- =====================================================
-- Fecha: 2025-01-23
-- Descripción: Sistema completo de retención y aprendizaje efectivo
-- Ejecutar en: pgAdmin4
-- =====================================================

-- =====================================================
-- 1. SISTEMA DE MISIONES DIARIAS AUTOMÁTICAS
-- =====================================================

-- Tabla de definiciones de misiones (plantillas)
CREATE TABLE IF NOT EXISTS daily_quest_templates (
    id SERIAL PRIMARY KEY,
    quest_code VARCHAR(50) UNIQUE NOT NULL,
    quest_name VARCHAR(200) NOT NULL,
    quest_description TEXT NOT NULL,
    quest_type VARCHAR(50) NOT NULL CHECK (quest_type IN (
        'answer_questions',
        'correct_streak',
        'complete_session',
        'play_game_mode',
        'spend_time',
        'improve_accuracy',
        'master_questions',
        'daily_login'
    )),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    target_value INTEGER NOT NULL,
    reward_luminarias INTEGER NOT NULL,
    bonus_luminarias INTEGER DEFAULT 0,
    bonus_condition_hours INTEGER,
    icon VARCHAR(50) DEFAULT '🎯',
    color VARCHAR(20) DEFAULT '#4CAF50',
    is_active BOOLEAN DEFAULT TRUE,
    weight INTEGER DEFAULT 1,
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

-- Tabla de progreso de misiones
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
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    total_luminarias_earned INTEGER DEFAULT 0,
    total_bonus_earned INTEGER DEFAULT 0,
    last_completion_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_daily_quests_user_date ON user_daily_quests(user_id, quest_date);
CREATE INDEX IF NOT EXISTS idx_user_daily_quests_status ON user_daily_quests(status);
CREATE INDEX IF NOT EXISTS idx_daily_quest_progress_user_quest ON daily_quest_progress(user_quest_id);
CREATE INDEX IF NOT EXISTS idx_daily_quest_stats_user ON daily_quest_stats(user_id);

-- Función para actualizar progreso de misión
CREATE OR REPLACE FUNCTION update_daily_quest_progress()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_progress >= NEW.target_value AND OLD.current_progress < NEW.target_value THEN
        NEW.status = 'completed';
        NEW.completed_at = NOW();

        IF (SELECT bonus_condition_hours FROM daily_quest_templates WHERE id = NEW.template_id) IS NOT NULL THEN
            IF (NOW() - NEW.started_at) <= (SELECT bonus_condition_hours FROM daily_quest_templates WHERE id = NEW.template_id) * INTERVAL '1 hour' THEN
                NEW.bonus_earned = TRUE;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_daily_quest_progress ON user_daily_quests;
CREATE TRIGGER trigger_update_daily_quest_progress
BEFORE UPDATE OF current_progress ON user_daily_quests
FOR EACH ROW
EXECUTE FUNCTION update_daily_quest_progress();

-- Función para reclamar recompensa
CREATE OR REPLACE FUNCTION claim_daily_quest_reward(p_user_quest_id INTEGER)
RETURNS TABLE(success BOOLEAN, luminarias_earned INTEGER, bonus_earned INTEGER, message TEXT) AS $$
DECLARE
    v_user_id INTEGER;
    v_template_id INTEGER;
    v_reward INTEGER;
    v_bonus INTEGER := 0;
    v_total INTEGER;
    v_bonus_earned BOOLEAN;
    v_quest_date DATE;
BEGIN
    SELECT uq.user_id, uq.template_id, t.reward_luminarias, t.bonus_luminarias, uq.bonus_earned, uq.quest_date
    INTO v_user_id, v_template_id, v_reward, v_bonus, v_bonus_earned, v_quest_date
    FROM user_daily_quests uq
    JOIN daily_quest_templates t ON t.id = uq.template_id
    WHERE uq.id = p_user_quest_id AND uq.status = 'completed' AND uq.reward_claimed = FALSE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 0, 'Misión no encontrada o recompensa ya reclamada'::TEXT;
        RETURN;
    END IF;

    IF v_bonus_earned THEN
        v_total := v_reward + v_bonus;
    ELSE
        v_total := v_reward;
        v_bonus := 0;
    END IF;

    PERFORM process_luminarias_transaction(
        v_user_id, v_total, 'earn', 'user', 'engagement', 'daily_quest', 'daily_quest_completion',
        jsonb_build_object('quest_id', p_user_quest_id, 'template_id', v_template_id, 'bonus_earned', v_bonus_earned)
    );

    UPDATE user_daily_quests SET reward_claimed = TRUE WHERE id = p_user_quest_id;

    INSERT INTO daily_quest_stats (user_id, total_quests_completed, total_luminarias_earned, total_bonus_earned, last_completion_date)
    VALUES (v_user_id, 1, v_reward, v_bonus, v_quest_date)
    ON CONFLICT (user_id) DO UPDATE SET
        total_quests_completed = daily_quest_stats.total_quests_completed + 1,
        total_luminarias_earned = daily_quest_stats.total_luminarias_earned + v_reward,
        total_bonus_earned = daily_quest_stats.total_bonus_earned + v_bonus,
        last_completion_date = v_quest_date,
        updated_at = NOW();

    UPDATE daily_quest_stats
    SET
        current_streak_days = CASE
            WHEN last_completion_date = v_quest_date - INTERVAL '1 day' THEN current_streak_days + 1
            WHEN last_completion_date = v_quest_date THEN current_streak_days
            ELSE 1
        END,
        longest_streak_days = GREATEST(
            longest_streak_days,
            CASE WHEN last_completion_date = v_quest_date - INTERVAL '1 day' THEN current_streak_days + 1 ELSE 1 END
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
    UPDATE user_daily_quests SET status = 'expired'
    WHERE status = 'active' AND quest_date < CURRENT_DATE;

    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    WITH expired_quests AS (
        SELECT user_id, COUNT(*) as failed_count
        FROM user_daily_quests
        WHERE status = 'expired' AND quest_date = CURRENT_DATE - INTERVAL '1 day'
        GROUP BY user_id
    )
    INSERT INTO daily_quest_stats (user_id, total_quests_failed, current_streak_days)
    SELECT user_id, failed_count, 0 FROM expired_quests
    ON CONFLICT (user_id) DO UPDATE SET
        total_quests_failed = daily_quest_stats.total_quests_failed + EXCLUDED.total_quests_failed,
        current_streak_days = 0,
        updated_at = NOW();

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Datos iniciales: Plantillas de misiones
INSERT INTO daily_quest_templates (quest_code, quest_name, quest_description, quest_type, difficulty, target_value, reward_luminarias, bonus_luminarias, bonus_condition_hours, icon, color, weight) VALUES
('daily_login', 'Inicio de Sesión Diario', 'Inicia sesión en LUMIQUIZ hoy', 'daily_login', 'easy', 1, 20, 10, 2, '🌅', '#4CAF50', 10),
('answer_5', 'Calentamiento Mental', 'Responde correctamente 5 preguntas', 'answer_questions', 'easy', 5, 30, 15, 3, '🧠', '#2196F3', 8),
('complete_1_session', 'Primera Sesión', 'Completa 1 sesión de estudio', 'complete_session', 'easy', 1, 25, 10, 4, '📚', '#00BCD4', 8),
('streak_3', 'Mini Racha', 'Acierta 3 preguntas seguidas', 'correct_streak', 'easy', 3, 35, 15, 2, '🔥', '#FF9800', 7),
('answer_10', 'Estudiante Dedicado', 'Responde correctamente 10 preguntas', 'answer_questions', 'medium', 10, 50, 25, 4, '📖', '#2196F3', 6),
('complete_2_sessions', 'Doble Sesión', 'Completa 2 sesiones de estudio', 'complete_session', 'medium', 2, 60, 30, 6, '📚', '#00BCD4', 5),
('streak_5', 'Racha de Fuego', 'Acierta 5 preguntas seguidas', 'correct_streak', 'medium', 5, 70, 35, 3, '🔥', '#FF5722', 5),
('spend_15min', 'Cuarto de Hora', 'Estudia durante 15 minutos', 'spend_time', 'medium', 15, 45, 20, 5, '⏰', '#9C27B0', 6),
('master_3', 'Dominio Inicial', 'Domina 3 preguntas nuevas', 'master_questions', 'medium', 3, 55, 25, 5, '⭐', '#FFC107', 4),
('answer_20', 'Maratonista Mental', 'Responde correctamente 20 preguntas', 'answer_questions', 'hard', 20, 100, 50, 6, '🏃', '#2196F3', 3),
('complete_3_sessions', 'Triple Jornada', 'Completa 3 sesiones de estudio', 'complete_session', 'hard', 3, 120, 60, 8, '📚', '#00BCD4', 2),
('streak_10', 'Racha Perfecta', 'Acierta 10 preguntas seguidas', 'correct_streak', 'hard', 10, 150, 75, 4, '🔥', '#F44336', 3),
('spend_30min', 'Media Hora Productiva', 'Estudia durante 30 minutos', 'spend_time', 'hard', 30, 90, 45, 7, '⏰', '#673AB7', 3),
('master_5', 'Maestría Avanzada', 'Domina 5 preguntas nuevas', 'master_questions', 'hard', 5, 110, 55, 6, '⭐', '#FF9800', 2),
('play_duel', 'Duelo del Día', 'Juega 1 partida en modo Duelo', 'play_game_mode', 'medium', 1, 60, 30, 4, '⚔️', '#E91E63', 4),
('play_exam', 'Examen de Práctica', 'Completa 1 examen simulado', 'play_game_mode', 'hard', 1, 100, 50, 5, '📝', '#3F51B5', 2),
('improve_accuracy', 'Superación Personal', 'Mejora tu % de acierto en 5 puntos', 'improve_accuracy', 'hard', 5, 80, 40, 8, '📈', '#4CAF50', 3)
ON CONFLICT (quest_code) DO NOTHING;

-- =====================================================
-- 2. SISTEMA DE NOTIFICACIONES PUSH
-- =====================================================

CREATE TABLE IF NOT EXISTS user_push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, player_id)
);

CREATE TABLE IF NOT EXISTS push_notifications_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('onesignal', 'fcm')),
    player_ids JSONB NOT NULL,
    success BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_push_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    notification_title VARCHAR(200) NOT NULL,
    notification_body TEXT NOT NULL,
    notification_data JSONB,
    scheduled_for TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_log_user ON push_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent_at ON push_notifications_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_push_sent ON scheduled_push_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_push_for ON scheduled_push_notifications(scheduled_for);

-- =====================================================
-- 3. SISTEMA DE REPETICIÓN ESPACIADA
-- =====================================================

CREATE TABLE IF NOT EXISTS spaced_repetition_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),
    next_review_date TIMESTAMP NOT NULL,
    last_reviewed_at TIMESTAMP,
    interval_days INTEGER DEFAULT 1,
    ease_factor DECIMAL(4,2) DEFAULT 2.50,
    consecutive_correct INTEGER DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_correct INTEGER DEFAULT 0,
    total_incorrect INTEGER DEFAULT 0,
    last_response_correct BOOLEAN,
    last_response_time_seconds INTEGER,
    first_seen_at TIMESTAMP DEFAULT NOW(),
    mastered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS spaced_repetition_reviews (
    id SERIAL PRIMARY KEY,
    queue_id INTEGER NOT NULL REFERENCES spaced_repetition_queue(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    was_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,
    confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),
    interval_before INTEGER,
    ease_factor_before DECIMAL(4,2),
    interval_after INTEGER,
    ease_factor_after DECIMAL(4,2),
    next_review_date TIMESTAMP,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spaced_repetition_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    interval_new INTEGER DEFAULT 1,
    interval_learning_1 INTEGER DEFAULT 3,
    interval_learning_2 INTEGER DEFAULT 7,
    interval_review_base INTEGER DEFAULT 14,
    max_interval_days INTEGER DEFAULT 365,
    max_reviews_per_day INTEGER DEFAULT 50,
    max_new_per_day INTEGER DEFAULT 20,
    mastery_threshold INTEGER DEFAULT 5,
    mastery_min_interval INTEGER DEFAULT 60,
    ease_factor_min DECIMAL(4,2) DEFAULT 1.30,
    ease_factor_max DECIMAL(4,2) DEFAULT 3.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS spaced_repetition_daily_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE DEFAULT CURRENT_DATE,
    new_cards_seen INTEGER DEFAULT 0,
    reviews_completed INTEGER DEFAULT 0,
    correct_reviews INTEGER DEFAULT 0,
    incorrect_reviews INTEGER DEFAULT 0,
    cards_mastered INTEGER DEFAULT 0,
    total_study_time_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_sr_queue_user_next_review ON spaced_repetition_queue(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_sr_queue_status ON spaced_repetition_queue(status);
CREATE INDEX IF NOT EXISTS idx_sr_queue_block ON spaced_repetition_queue(block_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_queue ON spaced_repetition_reviews(queue_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_user ON spaced_repetition_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_sr_daily_stats_user_date ON spaced_repetition_daily_stats(user_id, stat_date);

-- Función para calcular próximo intervalo
CREATE OR REPLACE FUNCTION calculate_next_interval(
    p_ease_factor DECIMAL,
    p_current_interval INTEGER,
    p_consecutive_correct INTEGER,
    p_was_correct BOOLEAN
)
RETURNS TABLE(new_interval INTEGER, new_ease_factor DECIMAL) AS $$
DECLARE
    v_interval INTEGER;
    v_ease DECIMAL := p_ease_factor;
BEGIN
    IF p_was_correct THEN
        IF p_consecutive_correct = 0 THEN
            v_interval := 1;
        ELSIF p_consecutive_correct = 1 THEN
            v_interval := 3;
        ELSIF p_consecutive_correct = 2 THEN
            v_interval := 7;
        ELSE
            v_interval := CEIL(p_current_interval * v_ease);
        END IF;
        v_ease := LEAST(v_ease + 0.10, 3.00);
    ELSE
        v_interval := 1;
        v_ease := GREATEST(v_ease - 0.20, 1.30);
    END IF;

    v_interval := LEAST(v_interval, 365);
    RETURN QUERY SELECT v_interval, v_ease;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar revisión
CREATE OR REPLACE FUNCTION process_spaced_repetition_review(
    p_user_id INTEGER,
    p_question_id INTEGER,
    p_was_correct BOOLEAN,
    p_response_time_seconds INTEGER DEFAULT NULL,
    p_confidence_rating INTEGER DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, next_review_date TIMESTAMP, new_interval INTEGER, new_status VARCHAR) AS $$
DECLARE
    v_queue_id INTEGER;
    v_current_interval INTEGER;
    v_current_ease DECIMAL;
    v_consecutive_correct INTEGER;
    v_new_interval INTEGER;
    v_new_ease DECIMAL;
    v_next_date TIMESTAMP;
    v_new_status VARCHAR(20);
BEGIN
    SELECT id, interval_days, ease_factor, consecutive_correct
    INTO v_queue_id, v_current_interval, v_current_ease, v_consecutive_correct
    FROM spaced_repetition_queue
    WHERE user_id = p_user_id AND question_id = p_question_id;

    IF v_queue_id IS NULL THEN
        INSERT INTO spaced_repetition_queue (user_id, question_id, block_id, next_review_date)
        SELECT p_user_id, p_question_id, q.block_id, NOW() + INTERVAL '1 day'
        FROM questions q WHERE q.id = p_question_id
        RETURNING id, interval_days, ease_factor, consecutive_correct
        INTO v_queue_id, v_current_interval, v_current_ease, v_consecutive_correct;
    END IF;

    SELECT * INTO v_new_interval, v_new_ease
    FROM calculate_next_interval(v_current_ease, v_current_interval, v_consecutive_correct, p_was_correct);

    v_next_date := NOW() + (v_new_interval || ' days')::INTERVAL;

    IF p_was_correct THEN
        IF v_consecutive_correct + 1 >= 5 AND v_new_interval >= 60 THEN
            v_new_status := 'mastered';
        ELSIF v_consecutive_correct + 1 >= 2 THEN
            v_new_status := 'review';
        ELSE
            v_new_status := 'learning';
        END IF;
    ELSE
        v_new_status := 'learning';
    END IF;

    INSERT INTO spaced_repetition_reviews (
        queue_id, user_id, question_id, was_correct, response_time_seconds, confidence_rating,
        interval_before, ease_factor_before, interval_after, ease_factor_after, next_review_date
    ) VALUES (
        v_queue_id, p_user_id, p_question_id, p_was_correct, p_response_time_seconds, p_confidence_rating,
        v_current_interval, v_current_ease, v_new_interval, v_new_ease, v_next_date
    );

    UPDATE spaced_repetition_queue
    SET
        status = v_new_status,
        next_review_date = v_next_date,
        last_reviewed_at = NOW(),
        interval_days = v_new_interval,
        ease_factor = v_new_ease,
        consecutive_correct = CASE WHEN p_was_correct THEN consecutive_correct + 1 ELSE 0 END,
        total_reviews = total_reviews + 1,
        total_correct = total_correct + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
        total_incorrect = total_incorrect + CASE WHEN NOT p_was_correct THEN 1 ELSE 0 END,
        last_response_correct = p_was_correct,
        last_response_time_seconds = p_response_time_seconds,
        mastered_at = CASE WHEN v_new_status = 'mastered' AND status != 'mastered' THEN NOW() ELSE mastered_at END,
        updated_at = NOW()
    WHERE id = v_queue_id;

    INSERT INTO spaced_repetition_daily_stats (user_id, stat_date, reviews_completed, correct_reviews, incorrect_reviews, total_study_time_seconds)
    VALUES (p_user_id, CURRENT_DATE, 1, CASE WHEN p_was_correct THEN 1 ELSE 0 END, CASE WHEN NOT p_was_correct THEN 1 ELSE 0 END, COALESCE(p_response_time_seconds, 0))
    ON CONFLICT (user_id, stat_date) DO UPDATE SET
        reviews_completed = spaced_repetition_daily_stats.reviews_completed + 1,
        correct_reviews = spaced_repetition_daily_stats.correct_reviews + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
        incorrect_reviews = spaced_repetition_daily_stats.incorrect_reviews + CASE WHEN NOT p_was_correct THEN 1 ELSE 0 END,
        total_study_time_seconds = spaced_repetition_daily_stats.total_study_time_seconds + COALESCE(p_response_time_seconds, 0);

    RETURN QUERY SELECT TRUE, v_next_date, v_new_interval, v_new_status;
END;
$$ LANGUAGE plpgsql;

INSERT INTO spaced_repetition_config (user_id) VALUES (NULL) ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 4. SISTEMA DE DIFICULTAD ADAPTATIVA
-- =====================================================

CREATE TABLE IF NOT EXISTS user_adaptive_difficulty (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    target_accuracy INTEGER DEFAULT 75 CHECK (target_accuracy BETWEEN 50 AND 100),
    min_difficulty INTEGER DEFAULT 1 CHECK (min_difficulty BETWEEN 1 AND 5),
    max_difficulty INTEGER DEFAULT 5 CHECK (max_difficulty BETWEEN 1 AND 5),
    current_difficulty INTEGER DEFAULT 3 CHECK (current_difficulty BETWEEN 1 AND 5),
    last_adjustment_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, block_id),
    CHECK (max_difficulty >= min_difficulty)
);

CREATE TABLE IF NOT EXISTS adaptive_difficulty_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    was_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_adaptive_difficulty_user ON user_adaptive_difficulty(user_id);
CREATE INDEX IF NOT EXISTS idx_user_adaptive_difficulty_block ON user_adaptive_difficulty(block_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_user ON adaptive_difficulty_results(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_question ON adaptive_difficulty_results(question_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_created ON adaptive_difficulty_results(created_at);

-- =====================================================
-- 5. TRIGGER DE DESBLOQUEO AUTOMÁTICO DE BLOQUES
-- =====================================================

CREATE OR REPLACE FUNCTION auto_unlock_next_block()
RETURNS TRIGGER AS $$
DECLARE
    v_next_block_id INTEGER;
    v_current_orden INTEGER;
BEGIN
    IF NEW.porcentaje_progreso >= 80 AND (OLD.porcentaje_progreso IS NULL OR OLD.porcentaje_progreso < 80) THEN
        SELECT orden INTO v_current_orden FROM cronograma_bloques WHERE id = NEW.id;

        SELECT id INTO v_next_block_id
        FROM cronograma_bloques
        WHERE cronograma_id = NEW.cronograma_id AND orden = v_current_orden + 1
        LIMIT 1;

        IF v_next_block_id IS NOT NULL THEN
            UPDATE cronograma_bloques
            SET habilitado = TRUE, fecha_inicio_prevista = COALESCE(fecha_inicio_prevista, CURRENT_DATE)
            WHERE id = v_next_block_id;
        ELSE
            UPDATE cronograma_alumno SET porcentaje_progreso = 100, estado = 'completado'
            WHERE id = NEW.cronograma_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_unlock_next_block ON cronograma_bloques;
CREATE TRIGGER trigger_auto_unlock_next_block
AFTER UPDATE OF porcentaje_progreso ON cronograma_bloques
FOR EACH ROW
WHEN (NEW.porcentaje_progreso >= 80)
EXECUTE FUNCTION auto_unlock_next_block();

CREATE OR REPLACE FUNCTION recalcular_progreso_cronograma()
RETURNS TRIGGER AS $$
DECLARE
    v_progreso_promedio DECIMAL;
    v_nuevo_estado VARCHAR(20);
    v_diferencia_porcentual DECIMAL;
BEGIN
    SELECT COALESCE(AVG(porcentaje_progreso), 0) INTO v_progreso_promedio
    FROM cronograma_bloques WHERE cronograma_id = NEW.cronograma_id;

    DECLARE
        v_dias_totales INTEGER;
        v_dias_transcurridos INTEGER;
        v_progreso_esperado DECIMAL;
    BEGIN
        SELECT fecha_objetivo - fecha_inscripcion, CURRENT_DATE - fecha_inscripcion
        INTO v_dias_totales, v_dias_transcurridos
        FROM cronograma_alumno WHERE id = NEW.cronograma_id;

        v_progreso_esperado := (v_dias_transcurridos::DECIMAL / NULLIF(v_dias_totales, 0)) * 100;
        v_diferencia_porcentual := v_progreso_promedio - v_progreso_esperado;

        IF v_diferencia_porcentual >= 10 THEN
            v_nuevo_estado := 'adelantado';
        ELSIF v_diferencia_porcentual >= -10 THEN
            v_nuevo_estado := 'en_tiempo';
        ELSE
            v_nuevo_estado := 'retrasado';
        END IF;
    END;

    UPDATE cronograma_alumno
    SET porcentaje_progreso = ROUND(v_progreso_promedio, 2), estado = v_nuevo_estado,
        diferencia_porcentual = ROUND(v_diferencia_porcentual, 2)
    WHERE id = NEW.cronograma_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalcular_progreso_cronograma ON cronograma_bloques;
CREATE TRIGGER trigger_recalcular_progreso_cronograma
AFTER UPDATE OF porcentaje_progreso ON cronograma_bloques
FOR EACH ROW
EXECUTE FUNCTION recalcular_progreso_cronograma();

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada exitosamente';
    RAISE NOTICE '📊 Tablas creadas:';
    RAISE NOTICE '  - Sistema de Misiones Diarias: 4 tablas';
    RAISE NOTICE '  - Notificaciones Push: 3 tablas';
    RAISE NOTICE '  - Repetición Espaciada: 4 tablas';
    RAISE NOTICE '  - Dificultad Adaptativa: 2 tablas';
    RAISE NOTICE '  - Triggers: 2 triggers automáticos';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Total: 13 tablas nuevas + 7 funciones + 2 triggers';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Recuerda reiniciar el servidor para activar las nuevas rutas';
END $$;

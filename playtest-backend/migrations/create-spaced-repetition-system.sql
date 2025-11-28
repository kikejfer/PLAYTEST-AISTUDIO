-- =====================================================
-- SISTEMA DE REPETICIÓN ESPACIADA (SPACED REPETITION)
-- =====================================================
-- Algoritmo basado en SM-2 (SuperMemo 2) adaptado
-- Objetivo: Maximizar retención a largo plazo
-- =====================================================

-- Tabla de cola de repetición espaciada
CREATE TABLE IF NOT EXISTS spaced_repetition_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,

    -- Estado de la pregunta en el sistema
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mastered')),

    -- Intervalos y fechas
    next_review_date TIMESTAMP NOT NULL,
    last_reviewed_at TIMESTAMP,
    interval_days INTEGER DEFAULT 1,  -- Intervalo actual en días

    -- Métricas de aprendizaje
    ease_factor DECIMAL(4,2) DEFAULT 2.50,  -- Factor de facilidad (2.5 inicial según SM-2)
    consecutive_correct INTEGER DEFAULT 0,  -- Respuestas correctas consecutivas
    total_reviews INTEGER DEFAULT 0,        -- Total de revisiones
    total_correct INTEGER DEFAULT 0,        -- Total de aciertos
    total_incorrect INTEGER DEFAULT 0,      -- Total de fallos

    -- Última respuesta
    last_response_correct BOOLEAN,
    last_response_time_seconds INTEGER,

    -- Metadata
    first_seen_at TIMESTAMP DEFAULT NOW(),
    mastered_at TIMESTAMP,  -- Cuando alcanzó estado "mastered"

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, question_id)
);

-- Tabla de historial de revisiones
CREATE TABLE IF NOT EXISTS spaced_repetition_reviews (
    id SERIAL PRIMARY KEY,
    queue_id INTEGER NOT NULL REFERENCES spaced_repetition_queue(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    -- Respuesta del usuario
    was_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,
    confidence_rating INTEGER CHECK (confidence_rating BETWEEN 1 AND 5),  -- 1=muy difícil, 5=muy fácil

    -- Estado antes de la revisión
    interval_before INTEGER,
    ease_factor_before DECIMAL(4,2),

    -- Estado después de la revisión
    interval_after INTEGER,
    ease_factor_after DECIMAL(4,2),
    next_review_date TIMESTAMP,

    reviewed_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de configuración del sistema SR
CREATE TABLE IF NOT EXISTS spaced_repetition_config (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- NULL = configuración global

    -- Intervalos base (en días)
    interval_new INTEGER DEFAULT 1,           -- Nueva pregunta
    interval_learning_1 INTEGER DEFAULT 3,    -- Primer acierto
    interval_learning_2 INTEGER DEFAULT 7,    -- Segundo acierto consecutivo
    interval_review_base INTEGER DEFAULT 14,  -- Base para preguntas en revisión

    -- Límites
    max_interval_days INTEGER DEFAULT 365,    -- Máximo intervalo (1 año)
    max_reviews_per_day INTEGER DEFAULT 50,   -- Máximo de revisiones diarias
    max_new_per_day INTEGER DEFAULT 20,       -- Máximo de preguntas nuevas por día

    -- Thresholds
    mastery_threshold INTEGER DEFAULT 5,      -- Respuestas correctas consecutivas para "mastered"
    mastery_min_interval INTEGER DEFAULT 60,  -- Intervalo mínimo para considerar mastered (días)

    -- Factor de ajuste
    ease_factor_min DECIMAL(4,2) DEFAULT 1.30,  -- Mínimo factor de facilidad
    ease_factor_max DECIMAL(4,2) DEFAULT 3.00,  -- Máximo factor de facilidad

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Tabla de estadísticas diarias
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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_sr_queue_user_next_review ON spaced_repetition_queue(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_sr_queue_status ON spaced_repetition_queue(status);
CREATE INDEX IF NOT EXISTS idx_sr_queue_block ON spaced_repetition_queue(block_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_queue ON spaced_repetition_reviews(queue_id);
CREATE INDEX IF NOT EXISTS idx_sr_reviews_user ON spaced_repetition_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_sr_daily_stats_user_date ON spaced_repetition_daily_stats(user_id, stat_date);

-- =====================================================
-- FUNCIONES DEL SISTEMA
-- =====================================================

-- Función para calcular próximo intervalo usando SM-2 modificado
CREATE OR REPLACE FUNCTION calculate_next_interval(
    p_ease_factor DECIMAL,
    p_current_interval INTEGER,
    p_consecutive_correct INTEGER,
    p_was_correct BOOLEAN
)
RETURNS TABLE(
    new_interval INTEGER,
    new_ease_factor DECIMAL
) AS $$
DECLARE
    v_interval INTEGER;
    v_ease DECIMAL := p_ease_factor;
BEGIN
    IF p_was_correct THEN
        -- Respuesta correcta
        IF p_consecutive_correct = 0 THEN
            -- Primera vez correcta
            v_interval := 1;
        ELSIF p_consecutive_correct = 1 THEN
            -- Segunda vez correcta
            v_interval := 3;
        ELSIF p_consecutive_correct = 2 THEN
            -- Tercera vez correcta
            v_interval := 7;
        ELSE
            -- Cuarta vez en adelante: aplicar factor de facilidad
            v_interval := CEIL(p_current_interval * v_ease);
        END IF;

        -- Aumentar levemente el factor de facilidad
        v_ease := LEAST(v_ease + 0.10, 3.00);
    ELSE
        -- Respuesta incorrecta: resetear
        v_interval := 1;
        v_ease := GREATEST(v_ease - 0.20, 1.30);
    END IF;

    -- Limitar intervalo a máximo 365 días
    v_interval := LEAST(v_interval, 365);

    RETURN QUERY SELECT v_interval, v_ease;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar una revisión
CREATE OR REPLACE FUNCTION process_spaced_repetition_review(
    p_user_id INTEGER,
    p_question_id INTEGER,
    p_was_correct BOOLEAN,
    p_response_time_seconds INTEGER DEFAULT NULL,
    p_confidence_rating INTEGER DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    next_review_date TIMESTAMP,
    new_interval INTEGER,
    new_status VARCHAR
) AS $$
DECLARE
    v_queue_id INTEGER;
    v_current_interval INTEGER;
    v_current_ease DECIMAL;
    v_consecutive_correct INTEGER;
    v_new_interval INTEGER;
    v_new_ease DECIMAL;
    v_next_date TIMESTAMP;
    v_new_status VARCHAR(20);
    v_total_reviews INTEGER;
BEGIN
    -- Obtener o crear entrada en la cola
    SELECT id, interval_days, ease_factor, consecutive_correct, total_reviews
    INTO v_queue_id, v_current_interval, v_current_ease, v_consecutive_correct, v_total_reviews
    FROM spaced_repetition_queue
    WHERE user_id = p_user_id AND question_id = p_question_id;

    IF v_queue_id IS NULL THEN
        -- Primera vez que ve esta pregunta
        INSERT INTO spaced_repetition_queue (user_id, question_id, block_id, next_review_date)
        SELECT p_user_id, p_question_id, q.block_id, NOW() + INTERVAL '1 day'
        FROM questions q
        WHERE q.id = p_question_id
        RETURNING id, interval_days, ease_factor, consecutive_correct, total_reviews
        INTO v_queue_id, v_current_interval, v_current_ease, v_consecutive_correct, v_total_reviews;
    END IF;

    -- Calcular nuevo intervalo
    SELECT * INTO v_new_interval, v_new_ease
    FROM calculate_next_interval(
        v_current_ease,
        v_current_interval,
        v_consecutive_correct,
        p_was_correct
    );

    v_next_date := NOW() + (v_new_interval || ' days')::INTERVAL;

    -- Determinar nuevo estado
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

    -- Registrar revisión en historial
    INSERT INTO spaced_repetition_reviews (
        queue_id, user_id, question_id,
        was_correct, response_time_seconds, confidence_rating,
        interval_before, ease_factor_before,
        interval_after, ease_factor_after, next_review_date
    ) VALUES (
        v_queue_id, p_user_id, p_question_id,
        p_was_correct, p_response_time_seconds, p_confidence_rating,
        v_current_interval, v_current_ease,
        v_new_interval, v_new_ease, v_next_date
    );

    -- Actualizar cola
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

    -- Actualizar estadísticas diarias
    INSERT INTO spaced_repetition_daily_stats (user_id, stat_date, reviews_completed, correct_reviews, incorrect_reviews, total_study_time_seconds)
    VALUES (
        p_user_id,
        CURRENT_DATE,
        1,
        CASE WHEN p_was_correct THEN 1 ELSE 0 END,
        CASE WHEN NOT p_was_correct THEN 1 ELSE 0 END,
        COALESCE(p_response_time_seconds, 0)
    )
    ON CONFLICT (user_id, stat_date) DO UPDATE SET
        reviews_completed = spaced_repetition_daily_stats.reviews_completed + 1,
        correct_reviews = spaced_repetition_daily_stats.correct_reviews + CASE WHEN p_was_correct THEN 1 ELSE 0 END,
        incorrect_reviews = spaced_repetition_daily_stats.incorrect_reviews + CASE WHEN NOT p_was_correct THEN 1 ELSE 0 END,
        total_study_time_seconds = spaced_repetition_daily_stats.total_study_time_seconds + COALESCE(p_response_time_seconds, 0);

    RETURN QUERY SELECT TRUE, v_next_date, v_new_interval, v_new_status;
END;
$$ LANGUAGE plpgsql;

-- Insertar configuración global por defecto
INSERT INTO spaced_repetition_config (user_id) VALUES (NULL)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE spaced_repetition_queue IS 'Cola de preguntas con sistema de repetición espaciada';
COMMENT ON TABLE spaced_repetition_reviews IS 'Historial de revisiones de preguntas con SR';
COMMENT ON TABLE spaced_repetition_config IS 'Configuración del algoritmo de repetición espaciada';
COMMENT ON TABLE spaced_repetition_daily_stats IS 'Estadísticas diarias de uso del sistema SR';

COMMENT ON FUNCTION calculate_next_interval IS 'Calcula el próximo intervalo y factor de facilidad usando SM-2';
COMMENT ON FUNCTION process_spaced_repetition_review IS 'Procesa una revisión y actualiza el estado de la pregunta en SR';

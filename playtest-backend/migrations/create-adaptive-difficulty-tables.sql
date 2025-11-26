-- =====================================================
-- SISTEMA DE DIFICULTAD ADAPTATIVA AUTOMÁTICA
-- =====================================================

-- Tabla de configuración de dificultad adaptativa por usuario/bloque
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

-- Tabla de resultados para tracking de dificultad
CREATE TABLE IF NOT EXISTS adaptive_difficulty_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,

    was_correct BOOLEAN NOT NULL,
    response_time_seconds INTEGER,

    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_adaptive_difficulty_user ON user_adaptive_difficulty(user_id);
CREATE INDEX IF NOT EXISTS idx_user_adaptive_difficulty_block ON user_adaptive_difficulty(block_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_user ON adaptive_difficulty_results(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_question ON adaptive_difficulty_results(question_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_created ON adaptive_difficulty_results(created_at);

COMMENT ON TABLE user_adaptive_difficulty IS 'Configuración de dificultad adaptativa por usuario y bloque';
COMMENT ON TABLE adaptive_difficulty_results IS 'Resultados de preguntas para ajuste de dificultad';

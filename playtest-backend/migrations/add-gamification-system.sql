-- ============================================
-- MIGRACIÓN: Sistema de Gamificación
-- ============================================
-- Añade badges, logros, rankings y torneos al sistema de oposiciones
-- Fecha: 2025-01-06
-- ============================================

-- ============================================
-- TABLA: badges
-- Define los tipos de medallas/logros disponibles
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50) DEFAULT '🏆',
    tipo VARCHAR(50) NOT NULL, -- 'progreso', 'racha', 'dominio', 'torneos', 'social'
    criterio_valor INTEGER, -- Valor necesario para obtener el badge (ej: 100 preguntas)
    puntos_otorga INTEGER DEFAULT 10,
    es_secreto BOOLEAN DEFAULT false,
    orden_visualizacion INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: alumno_badges
-- Badges obtenidos por cada alumno
-- ============================================
CREATE TABLE IF NOT EXISTS alumno_badges (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    oposicion_id INTEGER REFERENCES oposiciones(id) ON DELETE CASCADE,
    obtenido_en TIMESTAMP DEFAULT NOW(),
    notificado BOOLEAN DEFAULT false,
    UNIQUE(alumno_id, badge_id, oposicion_id)
);

-- ============================================
-- TABLA: torneos
-- Competiciones entre alumnos de una oposición
-- ============================================
CREATE TABLE IF NOT EXISTS torneos (
    id SERIAL PRIMARY KEY,
    oposicion_id INTEGER NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
    profesor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL, -- 'puntos', 'velocidad', 'precision', 'resistencia'
    bloque_id INTEGER REFERENCES bloques_temas(id) ON DELETE SET NULL, -- NULL = toda la oposición
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    max_participantes INTEGER,
    num_preguntas INTEGER DEFAULT 20,
    estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'activo', 'finalizado', 'cancelado'
    premios JSONB, -- [{posicion: 1, badge_id: 5, puntos: 100}, ...]
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: torneo_participantes
-- Alumnos inscritos en torneos
-- ============================================
CREATE TABLE IF NOT EXISTS torneo_participantes (
    id SERIAL PRIMARY KEY,
    torneo_id INTEGER NOT NULL REFERENCES torneos(id) ON DELETE CASCADE,
    alumno_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fecha_inscripcion TIMESTAMP DEFAULT NOW(),
    fecha_participacion TIMESTAMP,
    puntuacion INTEGER DEFAULT 0,
    respuestas_correctas INTEGER DEFAULT 0,
    respuestas_incorrectas INTEGER DEFAULT 0,
    tiempo_total_segundos INTEGER DEFAULT 0,
    posicion INTEGER,
    completado BOOLEAN DEFAULT false,
    UNIQUE(torneo_id, alumno_id)
);

-- ============================================
-- TABLA: torneo_respuestas
-- Respuestas de alumnos en torneos (para validación)
-- ============================================
CREATE TABLE IF NOT EXISTS torneo_respuestas (
    id SERIAL PRIMARY KEY,
    participante_id INTEGER NOT NULL REFERENCES torneo_participantes(id) ON DELETE CASCADE,
    pregunta_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    respuesta VARCHAR(1) NOT NULL,
    correcta BOOLEAN NOT NULL,
    tiempo_segundos INTEGER NOT NULL,
    respondido_en TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TABLA: rachas_estudio
-- Racha de días consecutivos estudiando
-- ============================================
CREATE TABLE IF NOT EXISTS rachas_estudio (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    oposicion_id INTEGER NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
    racha_actual INTEGER DEFAULT 0,
    racha_maxima INTEGER DEFAULT 0,
    ultima_actividad DATE,
    UNIQUE(alumno_id, oposicion_id)
);

-- ============================================
-- TABLA: puntos_gamificacion
-- Sistema de puntos para ranking
-- ============================================
CREATE TABLE IF NOT EXISTS puntos_gamificacion (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    oposicion_id INTEGER NOT NULL REFERENCES oposiciones(id) ON DELETE CASCADE,
    puntos_totales INTEGER DEFAULT 0,
    puntos_progreso INTEGER DEFAULT 0,
    puntos_badges INTEGER DEFAULT 0,
    puntos_torneos INTEGER DEFAULT 0,
    puntos_racha INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    experiencia INTEGER DEFAULT 0,
    experiencia_siguiente_nivel INTEGER DEFAULT 100,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(alumno_id, oposicion_id)
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_alumno_badges_alumno ON alumno_badges(alumno_id);
CREATE INDEX IF NOT EXISTS idx_alumno_badges_badge ON alumno_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_torneos_oposicion ON torneos(oposicion_id);
CREATE INDEX IF NOT EXISTS idx_torneos_estado ON torneos(estado);
CREATE INDEX IF NOT EXISTS idx_torneo_participantes_torneo ON torneo_participantes(torneo_id);
CREATE INDEX IF NOT EXISTS idx_torneo_participantes_alumno ON torneo_participantes(alumno_id);
CREATE INDEX IF NOT EXISTS idx_torneo_respuestas_participante ON torneo_respuestas(participante_id);
CREATE INDEX IF NOT EXISTS idx_rachas_estudio_alumno ON rachas_estudio(alumno_id);
CREATE INDEX IF NOT EXISTS idx_puntos_gamificacion_alumno ON puntos_gamificacion(alumno_id);
CREATE INDEX IF NOT EXISTS idx_puntos_gamificacion_oposicion ON puntos_gamificacion(oposicion_id);

-- ============================================
-- FUNCIÓN: Actualizar racha de estudio
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_racha_estudio(
    p_alumno_id INTEGER,
    p_oposicion_id INTEGER
) RETURNS VOID AS $$
DECLARE
    v_ultima_actividad DATE;
    v_racha_actual INTEGER;
    v_racha_maxima INTEGER;
    v_hoy DATE := CURRENT_DATE;
BEGIN
    -- Obtener racha actual
    SELECT ultima_actividad, racha_actual, racha_maxima
    INTO v_ultima_actividad, v_racha_actual, v_racha_maxima
    FROM rachas_estudio
    WHERE alumno_id = p_alumno_id AND oposicion_id = p_oposicion_id;

    -- Si no existe registro, crear uno
    IF NOT FOUND THEN
        INSERT INTO rachas_estudio (alumno_id, oposicion_id, racha_actual, racha_maxima, ultima_actividad)
        VALUES (p_alumno_id, p_oposicion_id, 1, 1, v_hoy);
        RETURN;
    END IF;

    -- Si la última actividad fue hoy, no hacer nada
    IF v_ultima_actividad = v_hoy THEN
        RETURN;
    END IF;

    -- Si la última actividad fue ayer, incrementar racha
    IF v_ultima_actividad = v_hoy - INTERVAL '1 day' THEN
        v_racha_actual := v_racha_actual + 1;

        -- Actualizar racha máxima si es necesario
        IF v_racha_actual > v_racha_maxima THEN
            v_racha_maxima := v_racha_actual;
        END IF;
    ELSE
        -- Si no fue ayer, reiniciar racha
        v_racha_actual := 1;
    END IF;

    -- Actualizar registro
    UPDATE rachas_estudio
    SET racha_actual = v_racha_actual,
        racha_maxima = v_racha_maxima,
        ultima_actividad = v_hoy
    WHERE alumno_id = p_alumno_id AND oposicion_id = p_oposicion_id;

END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Calcular puntos por dominio
-- ============================================
CREATE OR REPLACE FUNCTION calcular_puntos_dominio(
    p_alumno_id INTEGER,
    p_oposicion_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_preguntas_dominadas INTEGER;
    v_puntos INTEGER;
BEGIN
    -- Contar preguntas dominadas
    SELECT COUNT(DISTINCT dp.pregunta_id)
    INTO v_preguntas_dominadas
    FROM dominio_preguntas dp
    JOIN questions q ON dp.pregunta_id = q.id
    JOIN temas t ON q.tema_id = t.id
    JOIN bloques_temas bt ON t.bloque_id = bt.id
    WHERE dp.alumno_id = p_alumno_id
      AND dp.es_dominada = true
      AND bt.oposicion_id = p_oposicion_id;

    -- Calcular puntos (10 puntos por pregunta dominada)
    v_puntos := v_preguntas_dominadas * 10;

    RETURN v_puntos;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Calcular nivel y experiencia
-- ============================================
CREATE OR REPLACE FUNCTION calcular_nivel_experiencia(
    p_puntos_totales INTEGER,
    OUT nivel INTEGER,
    OUT experiencia INTEGER,
    OUT experiencia_siguiente_nivel INTEGER
) AS $$
BEGIN
    -- Fórmula: nivel = floor(sqrt(puntos_totales / 100)) + 1
    nivel := FLOOR(SQRT(p_puntos_totales::FLOAT / 100.0)) + 1;

    -- Experiencia en el nivel actual
    experiencia := p_puntos_totales - (((nivel - 1) * (nivel - 1)) * 100);

    -- Experiencia necesaria para siguiente nivel
    experiencia_siguiente_nivel := (nivel * nivel * 100) - (((nivel - 1) * (nivel - 1)) * 100);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Actualizar puntos gamificación
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_puntos_gamificacion(
    p_alumno_id INTEGER,
    p_oposicion_id INTEGER
) RETURNS VOID AS $$
DECLARE
    v_puntos_progreso INTEGER;
    v_puntos_badges INTEGER;
    v_puntos_torneos INTEGER;
    v_puntos_racha INTEGER;
    v_puntos_totales INTEGER;
    v_nivel INTEGER;
    v_experiencia INTEGER;
    v_exp_siguiente INTEGER;
BEGIN
    -- Calcular puntos de progreso (dominio de preguntas)
    v_puntos_progreso := calcular_puntos_dominio(p_alumno_id, p_oposicion_id);

    -- Calcular puntos de badges
    SELECT COALESCE(SUM(b.puntos_otorga), 0)
    INTO v_puntos_badges
    FROM alumno_badges ab
    JOIN badges b ON ab.badge_id = b.id
    WHERE ab.alumno_id = p_alumno_id
      AND (ab.oposicion_id = p_oposicion_id OR ab.oposicion_id IS NULL);

    -- Calcular puntos de torneos
    SELECT COALESCE(SUM(puntuacion), 0)
    INTO v_puntos_torneos
    FROM torneo_participantes tp
    JOIN torneos t ON tp.torneo_id = t.id
    WHERE tp.alumno_id = p_alumno_id
      AND t.oposicion_id = p_oposicion_id
      AND tp.completado = true;

    -- Calcular puntos de racha
    SELECT COALESCE(racha_actual * 5, 0)
    INTO v_puntos_racha
    FROM rachas_estudio
    WHERE alumno_id = p_alumno_id AND oposicion_id = p_oposicion_id;

    -- Total
    v_puntos_totales := v_puntos_progreso + v_puntos_badges + v_puntos_torneos + v_puntos_racha;

    -- Calcular nivel y experiencia
    SELECT * INTO v_nivel, v_experiencia, v_exp_siguiente
    FROM calcular_nivel_experiencia(v_puntos_totales);

    -- Insertar o actualizar
    INSERT INTO puntos_gamificacion (
        alumno_id,
        oposicion_id,
        puntos_totales,
        puntos_progreso,
        puntos_badges,
        puntos_torneos,
        puntos_racha,
        nivel,
        experiencia,
        experiencia_siguiente_nivel,
        updated_at
    ) VALUES (
        p_alumno_id,
        p_oposicion_id,
        v_puntos_totales,
        v_puntos_progreso,
        v_puntos_badges,
        v_puntos_torneos,
        v_puntos_racha,
        v_nivel,
        v_experiencia,
        v_exp_siguiente,
        NOW()
    )
    ON CONFLICT (alumno_id, oposicion_id)
    DO UPDATE SET
        puntos_totales = v_puntos_totales,
        puntos_progreso = v_puntos_progreso,
        puntos_badges = v_puntos_badges,
        puntos_torneos = v_puntos_torneos,
        puntos_racha = v_puntos_racha,
        nivel = v_nivel,
        experiencia = v_experiencia,
        experiencia_siguiente_nivel = v_exp_siguiente,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCIÓN: Verificar y otorgar badges automáticos
-- ============================================
CREATE OR REPLACE FUNCTION verificar_badges_automaticos(
    p_alumno_id INTEGER,
    p_oposicion_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_badges_otorgados INTEGER := 0;
    v_preguntas_dominadas INTEGER;
    v_bloques_completados INTEGER;
    v_racha_actual INTEGER;
    v_badge_record RECORD;
BEGIN
    -- Obtener estadísticas del alumno
    SELECT COALESCE(ca.preguntas_dominadas, 0)
    INTO v_preguntas_dominadas
    FROM cronograma_alumno ca
    WHERE ca.alumno_id = p_alumno_id AND ca.oposicion_id = p_oposicion_id;

    SELECT COUNT(*)
    INTO v_bloques_completados
    FROM cronograma_bloques cb
    JOIN cronograma_alumno ca ON cb.cronograma_id = ca.id
    WHERE ca.alumno_id = p_alumno_id
      AND ca.oposicion_id = p_oposicion_id
      AND cb.completado = true;

    SELECT COALESCE(racha_actual, 0)
    INTO v_racha_actual
    FROM rachas_estudio
    WHERE alumno_id = p_alumno_id AND oposicion_id = p_oposicion_id;

    -- Verificar badges de progreso
    FOR v_badge_record IN
        SELECT * FROM badges
        WHERE tipo = 'progreso' AND criterio_valor IS NOT NULL
    LOOP
        IF v_preguntas_dominadas >= v_badge_record.criterio_valor THEN
            -- Intentar otorgar badge (ignorar si ya lo tiene)
            INSERT INTO alumno_badges (alumno_id, badge_id, oposicion_id)
            VALUES (p_alumno_id, v_badge_record.id, p_oposicion_id)
            ON CONFLICT DO NOTHING;

            IF FOUND THEN
                v_badges_otorgados := v_badges_otorgados + 1;
            END IF;
        END IF;
    END LOOP;

    -- Verificar badges de dominio (bloques completados)
    FOR v_badge_record IN
        SELECT * FROM badges
        WHERE tipo = 'dominio' AND criterio_valor IS NOT NULL
    LOOP
        IF v_bloques_completados >= v_badge_record.criterio_valor THEN
            INSERT INTO alumno_badges (alumno_id, badge_id, oposicion_id)
            VALUES (p_alumno_id, v_badge_record.id, p_oposicion_id)
            ON CONFLICT DO NOTHING;

            IF FOUND THEN
                v_badges_otorgados := v_badges_otorgados + 1;
            END IF;
        END IF;
    END LOOP;

    -- Verificar badges de racha
    FOR v_badge_record IN
        SELECT * FROM badges
        WHERE tipo = 'racha' AND criterio_valor IS NOT NULL
    LOOP
        IF v_racha_actual >= v_badge_record.criterio_valor THEN
            INSERT INTO alumno_badges (alumno_id, badge_id, oposicion_id)
            VALUES (p_alumno_id, v_badge_record.id, p_oposicion_id)
            ON CONFLICT DO NOTHING;

            IF FOUND THEN
                v_badges_otorgados := v_badges_otorgados + 1;
            END IF;
        END IF;
    END LOOP;

    RETURN v_badges_otorgados;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS INICIALES: Badges predefinidos
-- ============================================
INSERT INTO badges (codigo, nombre, descripcion, icono, tipo, criterio_valor, puntos_otorga, orden_visualizacion) VALUES
('primeros_pasos', 'Primeros Pasos', 'Domina tus primeras 10 preguntas', '🌱', 'progreso', 10, 10, 1),
('aprendiz', 'Aprendiz', 'Domina 50 preguntas', '📚', 'progreso', 50, 25, 2),
('estudioso', 'Estudioso', 'Domina 100 preguntas', '🎓', 'progreso', 100, 50, 3),
('experto', 'Experto', 'Domina 250 preguntas', '🏅', 'progreso', 250, 100, 4),
('maestro', 'Maestro', 'Domina 500 preguntas', '👑', 'progreso', 500, 200, 5),
('leyenda', 'Leyenda', 'Domina 1000 preguntas', '⭐', 'progreso', 1000, 500, 6),

('primer_bloque', 'Primer Bloque', 'Completa tu primer bloque', '🎯', 'dominio', 1, 15, 10),
('tres_bloques', 'Triple Corona', 'Completa 3 bloques', '🔥', 'dominio', 3, 40, 11),
('cinco_bloques', 'Pentacampeón', 'Completa 5 bloques', '💪', 'dominio', 5, 75, 12),
('perfeccionista', 'Perfeccionista', 'Completa todos los bloques', '💎', 'dominio', 999, 150, 13),

('racha_3', 'Constante', 'Estudia 3 días seguidos', '🔥', 'racha', 3, 15, 20),
('racha_7', 'Semana Perfecta', 'Estudia 7 días seguidos', '⚡', 'racha', 7, 35, 21),
('racha_14', 'Dos Semanas', 'Estudia 14 días seguidos', '🌟', 'racha', 14, 70, 22),
('racha_30', 'Mes Completo', 'Estudia 30 días seguidos', '🏆', 'racha', 30, 150, 23),

('primer_torneo', 'Competidor', 'Participa en tu primer torneo', '⚔️', 'torneos', NULL, 20, 30),
('podium', 'En el Podio', 'Termina en top 3 en un torneo', '🥉', 'torneos', NULL, 50, 31),
('campeon', 'Campeón', 'Gana un torneo', '🥇', 'torneos', NULL, 100, 32)

ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE badges IS 'Define los tipos de medallas/logros disponibles en el sistema';
COMMENT ON TABLE alumno_badges IS 'Medallas obtenidas por cada alumno';
COMMENT ON TABLE torneos IS 'Competiciones entre alumnos de una oposición';
COMMENT ON TABLE torneo_participantes IS 'Alumnos inscritos en torneos con sus resultados';
COMMENT ON TABLE torneo_respuestas IS 'Respuestas de alumnos en torneos para validación';
COMMENT ON TABLE rachas_estudio IS 'Racha de días consecutivos estudiando';
COMMENT ON TABLE puntos_gamificacion IS 'Sistema de puntos y niveles para ranking';

COMMENT ON FUNCTION actualizar_racha_estudio IS 'Actualiza la racha de días consecutivos estudiando';
COMMENT ON FUNCTION calcular_puntos_dominio IS 'Calcula puntos basados en preguntas dominadas';
COMMENT ON FUNCTION calcular_nivel_experiencia IS 'Calcula nivel y experiencia basado en puntos totales';
COMMENT ON FUNCTION actualizar_puntos_gamificacion IS 'Recalcula todos los puntos de un alumno';
COMMENT ON FUNCTION verificar_badges_automaticos IS 'Verifica y otorga badges automáticos según criterios';

-- ============================================
-- TRIGGER: Actualizar estado de torneos
-- ============================================
CREATE OR REPLACE FUNCTION actualizar_estado_torneos() RETURNS TRIGGER AS $$
BEGIN
    -- Si la fecha de inicio ya pasó y está pendiente, activar
    IF NEW.fecha_inicio <= NOW() AND NEW.estado = 'pendiente' THEN
        NEW.estado := 'activo';
    END IF;

    -- Si la fecha de fin ya pasó y está activo, finalizar
    IF NEW.fecha_fin <= NOW() AND NEW.estado = 'activo' THEN
        NEW.estado := 'finalizado';
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_estado_torneos
    BEFORE INSERT OR UPDATE ON torneos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_estado_torneos();

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================

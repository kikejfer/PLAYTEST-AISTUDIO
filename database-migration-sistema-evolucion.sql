-- ===================================================================
-- LUMIQUIZ - SISTEMA DE SEGUIMIENTO Y EVOLUCIÓN DEL ESTUDIO
-- Script de migración para implementar tracking avanzado de aprendizaje
--
-- EJECUTAR EN: pgAdmin4 cuando estés listo para implementar
-- DURACIÓN ESTIMADA: 2-5 minutos (dependiendo de cantidad de datos)
--
-- IMPORTANTE: Este script es IDEMPOTENTE - puede ejecutarse múltiples veces
-- ===================================================================

BEGIN;

-- ===================================================================
-- PARTE 1: TABLA DE HISTORIAL DE RESPUESTAS NORMALIZADA
-- Reemplaza el sistema JSONB disperso con una tabla relacional optimizada
-- ===================================================================

CREATE TABLE IF NOT EXISTS historial_respuestas (
    historial_id SERIAL PRIMARY KEY,

    -- Referencias principales
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer_id INTEGER REFERENCES answers(id) ON DELETE SET NULL,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    game_id INTEGER REFERENCES games(id) ON DELETE SET NULL,

    -- Resultado de la respuesta
    fue_correcta BOOLEAN NOT NULL,
    tiempo_respuesta INTEGER, -- en milisegundos

    -- Contexto del intento
    modo_juego VARCHAR(50), -- 'classic', 'exam', 'refuerzo', 'duel', etc.
    dificultad_pregunta INTEGER,
    es_revision BOOLEAN DEFAULT false, -- si es una revisión de repetición espaciada
    numero_intento INTEGER DEFAULT 1, -- cuántas veces ha intentado esta pregunta

    -- Análisis de patrones
    tiempo_desde_ultima_revision INTEGER, -- días desde último intento
    confianza_usuario VARCHAR(20), -- 'muy_seguro', 'seguro', 'dudoso', 'adivinanza'

    -- Metadata
    fecha_respuesta TIMESTAMPTZ DEFAULT NOW(),
    session_id VARCHAR(255), -- para agrupar respuestas de una misma sesión

    -- Constraints
    CHECK (tiempo_respuesta IS NULL OR tiempo_respuesta >= 0),
    CHECK (dificultad_pregunta >= 1 AND dificultad_pregunta <= 5)
);

-- Índices optimizados para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_historial_user_block
    ON historial_respuestas(user_id, block_id);

CREATE INDEX IF NOT EXISTS idx_historial_user_question
    ON historial_respuestas(user_id, question_id);

CREATE INDEX IF NOT EXISTS idx_historial_question
    ON historial_respuestas(question_id);

CREATE INDEX IF NOT EXISTS idx_historial_fecha
    ON historial_respuestas(fecha_respuesta DESC);

CREATE INDEX IF NOT EXISTS idx_historial_incorrectas
    ON historial_respuestas(user_id, block_id, fue_correcta)
    WHERE fue_correcta = false;

-- Índice parcial para preguntas recientes (mejora performance de queries de refuerzo)
CREATE INDEX IF NOT EXISTS idx_historial_recientes
    ON historial_respuestas(user_id, question_id, fecha_respuesta DESC)
    WHERE fecha_respuesta > NOW() - INTERVAL '90 days';

COMMENT ON TABLE historial_respuestas IS
'Registro normalizado de todas las respuestas de usuarios. Reemplaza answer_history JSONB para permitir análisis avanzados.';

-- ===================================================================
-- PARTE 2: TABLA DE EVOLUCIÓN Y MAESTRÍA POR BLOQUE
-- Sistema de tracking de progreso granular por bloque de conocimiento
-- ===================================================================

CREATE TABLE IF NOT EXISTS evolucion_bloque (
    evolucion_id SERIAL PRIMARY KEY,

    -- Referencias
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,

    -- Métricas de maestría
    maestria DECIMAL(5, 2) DEFAULT 0.00, -- Porcentaje 0-100
    total_preguntas INTEGER DEFAULT 0,
    preguntas_vistas INTEGER DEFAULT 0,
    preguntas_dominadas INTEGER DEFAULT 0, -- >80% de acierto
    preguntas_en_progreso INTEGER DEFAULT 0, -- 40-80% acierto
    preguntas_dificiles INTEGER DEFAULT 0, -- <40% acierto

    -- Estado del bloque
    estado VARCHAR(20) DEFAULT 'no_iniciado',
    -- Estados: 'no_iniciado', 'en_progreso', 'completado', 'maestro'

    -- Tracking temporal
    primera_interaccion TIMESTAMPTZ,
    ultima_interaccion TIMESTAMPTZ,
    tiempo_total_estudio INTEGER DEFAULT 0, -- minutos acumulados
    sesiones_estudio INTEGER DEFAULT 0,

    -- Análisis de rendimiento
    racha_actual INTEGER DEFAULT 0, -- respuestas correctas consecutivas
    racha_maxima INTEGER DEFAULT 0,
    tasa_acierto_global DECIMAL(5,2) DEFAULT 0.00,
    tasa_acierto_reciente DECIMAL(5,2) DEFAULT 0.00, -- últimos 20 intentos

    -- Repetición espaciada
    proxima_revision TIMESTAMPTZ,
    nivel_retencion VARCHAR(20) DEFAULT 'nueva',
    -- Niveles: 'nueva', 'aprendiendo', 'revisando', 'dominada', 'olvidada'
    intervalo_revision INTEGER DEFAULT 1, -- días hasta próxima revisión

    -- Estadísticas avanzadas
    tiempo_promedio_respuesta INTEGER, -- milisegundos
    preguntas_faciles_correctas INTEGER DEFAULT 0,
    preguntas_dificiles_correctas INTEGER DEFAULT 0,

    -- Gamificación
    luminarias_ganadas INTEGER DEFAULT 0,
    logros_desbloqueados TEXT[], -- array de logros conseguidos en este bloque

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(user_id, block_id),
    CHECK (maestria >= 0 AND maestria <= 100),
    CHECK (estado IN ('no_iniciado', 'en_progreso', 'completado', 'maestro')),
    CHECK (nivel_retencion IN ('nueva', 'aprendiendo', 'revisando', 'dominada', 'olvidada')),
    CHECK (tasa_acierto_global >= 0 AND tasa_acierto_global <= 100),
    CHECK (racha_actual >= 0 AND racha_maxima >= racha_actual)
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_evolucion_user
    ON evolucion_bloque(user_id);

CREATE INDEX IF NOT EXISTS idx_evolucion_block
    ON evolucion_bloque(block_id);

CREATE INDEX IF NOT EXISTS idx_evolucion_maestria
    ON evolucion_bloque(maestria DESC)
    WHERE estado != 'no_iniciado';

CREATE INDEX IF NOT EXISTS idx_evolucion_estado
    ON evolucion_bloque(user_id, estado);

CREATE INDEX IF NOT EXISTS idx_evolucion_revision
    ON evolucion_bloque(user_id, proxima_revision)
    WHERE proxima_revision IS NOT NULL;

COMMENT ON TABLE evolucion_bloque IS
'Tracking detallado del progreso y maestría del usuario en cada bloque de conocimiento.';

-- ===================================================================
-- PARTE 3: TABLA DE PREREQUISITOS DE BLOQUES
-- Sistema de desbloqueo progresivo de contenido
-- ===================================================================

CREATE TABLE IF NOT EXISTS block_prerequisites (
    id SERIAL PRIMARY KEY,

    block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    prerequisite_block_id INTEGER NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,

    -- Condiciones para desbloqueo
    maestria_minima DECIMAL(5,2) DEFAULT 80.00,
    requiere_completado BOOLEAN DEFAULT false, -- si requiere estado 'completado'

    -- Orden de prerequisitos (1 = debe completarse primero)
    orden INTEGER DEFAULT 1,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),

    -- Constraints
    UNIQUE(block_id, prerequisite_block_id),
    CHECK (block_id != prerequisite_block_id), -- un bloque no puede ser prerequisito de sí mismo
    CHECK (maestria_minima >= 0 AND maestria_minima <= 100),
    CHECK (orden > 0)
);

CREATE INDEX IF NOT EXISTS idx_prerequisites_block
    ON block_prerequisites(block_id);

CREATE INDEX IF NOT EXISTS idx_prerequisites_required
    ON block_prerequisites(prerequisite_block_id);

COMMENT ON TABLE block_prerequisites IS
'Define qué bloques deben dominarse antes de acceder a otros (árbol de conocimiento).';

-- ===================================================================
-- PARTE 4: FUNCIONES AUXILIARES
-- ===================================================================

-- Función para calcular maestría basada en historial
CREATE OR REPLACE FUNCTION calcular_maestria_bloque(p_user_id INTEGER, p_block_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_maestria DECIMAL(5,2);
BEGIN
    -- Cálculo ponderado:
    -- - 40% tasa de acierto global
    -- - 30% tasa de acierto reciente (últimos 20 intentos)
    -- - 20% preguntas únicas dominadas / total preguntas
    -- - 10% bonus por consistencia (racha)

    SELECT
        LEAST(100, GREATEST(0,
            -- Tasa global (40%)
            (COALESCE(AVG(CASE WHEN fue_correcta THEN 1.0 ELSE 0.0 END) * 100, 0) * 0.4) +

            -- Tasa reciente (30%) - últimos 20 intentos
            (COALESCE(
                (SELECT AVG(CASE WHEN fue_correcta THEN 1.0 ELSE 0.0 END) * 100
                 FROM (
                     SELECT fue_correcta
                     FROM historial_respuestas
                     WHERE user_id = p_user_id AND block_id = p_block_id
                     ORDER BY fecha_respuesta DESC
                     LIMIT 20
                 ) recent),
                0
            ) * 0.3) +

            -- Cobertura de preguntas (20%)
            (COALESCE(
                (SELECT (COUNT(DISTINCT question_id)::FLOAT / NULLIF(
                    (SELECT COUNT(*) FROM questions WHERE block_id = p_block_id), 0
                )) * 100
                FROM historial_respuestas
                WHERE user_id = p_user_id AND block_id = p_block_id AND fue_correcta = true),
                0
            ) * 0.2) +

            -- Bonus por consistencia (10%)
            (LEAST(10, COALESCE(
                (SELECT racha_actual::FLOAT / 5), 0
            )))
        ))
    INTO v_maestria
    FROM historial_respuestas
    WHERE user_id = p_user_id AND block_id = p_block_id;

    RETURN COALESCE(v_maestria, 0.00);
END;
$$ LANGUAGE plpgsql;

-- Función para determinar estado del bloque
CREATE OR REPLACE FUNCTION determinar_estado_bloque(p_maestria DECIMAL, p_preguntas_vistas INTEGER)
RETURNS VARCHAR(20) AS $$
BEGIN
    IF p_preguntas_vistas = 0 THEN
        RETURN 'no_iniciado';
    ELSIF p_maestria >= 95 THEN
        RETURN 'maestro';
    ELSIF p_maestria >= 85 THEN
        RETURN 'completado';
    ELSE
        RETURN 'en_progreso';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar si un bloque está desbloqueado para un usuario
CREATE OR REPLACE FUNCTION bloque_desbloqueado(p_user_id INTEGER, p_block_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_prerequisitos_cumplidos BOOLEAN;
BEGIN
    -- Si no hay prerequisitos, está desbloqueado
    IF NOT EXISTS (SELECT 1 FROM block_prerequisites WHERE block_id = p_block_id) THEN
        RETURN TRUE;
    END IF;

    -- Verificar que todos los prerequisitos se cumplan
    SELECT COALESCE(bool_and(
        CASE
            WHEN bp.requiere_completado THEN
                eb.estado IN ('completado', 'maestro')
            ELSE
                eb.maestria >= bp.maestria_minima
        END
    ), FALSE)
    INTO v_prerequisitos_cumplidos
    FROM block_prerequisites bp
    LEFT JOIN evolucion_bloque eb ON eb.block_id = bp.prerequisite_block_id
        AND eb.user_id = p_user_id
    WHERE bp.block_id = p_block_id;

    RETURN v_prerequisitos_cumplidos;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener preguntas difíciles de un usuario
CREATE OR REPLACE FUNCTION obtener_preguntas_dificiles(
    p_user_id INTEGER,
    p_block_id INTEGER DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    question_id INTEGER,
    text_question TEXT,
    topic VARCHAR,
    difficulty INTEGER,
    total_intentos BIGINT,
    total_fallos BIGINT,
    tasa_fallo NUMERIC,
    ultimo_intento TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        q.id,
        q.text_question,
        q.topic,
        q.difficulty,
        COUNT(hr.historial_id) as total_intentos,
        COUNT(*) FILTER (WHERE NOT hr.fue_correcta) as total_fallos,
        ROUND(
            (COUNT(*) FILTER (WHERE NOT hr.fue_correcta)::NUMERIC /
             NULLIF(COUNT(hr.historial_id), 0)) * 100,
            2
        ) as tasa_fallo,
        MAX(hr.fecha_respuesta) as ultimo_intento
    FROM questions q
    JOIN historial_respuestas hr ON q.id = hr.question_id
    WHERE hr.user_id = p_user_id
        AND (p_block_id IS NULL OR q.block_id = p_block_id)
    GROUP BY q.id, q.text_question, q.topic, q.difficulty
    HAVING COUNT(hr.historial_id) >= 2 -- al menos 2 intentos
        AND (COUNT(*) FILTER (WHERE NOT hr.fue_correcta)::FLOAT /
             COUNT(hr.historial_id)) > 0.4 -- más de 40% de fallos
    ORDER BY
        tasa_fallo DESC,
        total_intentos DESC,
        ultimo_intento DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- PARTE 5: TRIGGERS AUTOMÁTICOS
-- ===================================================================

-- Trigger para actualizar evolucion_bloque después de cada respuesta
CREATE OR REPLACE FUNCTION trigger_actualizar_evolucion_bloque()
RETURNS TRIGGER AS $$
DECLARE
    v_maestria DECIMAL(5,2);
    v_estado VARCHAR(20);
    v_total_preguntas INTEGER;
    v_preguntas_vistas INTEGER;
    v_racha_actual INTEGER;
    v_racha_maxima INTEGER;
    v_tasa_global DECIMAL(5,2);
    v_tasa_reciente DECIMAL(5,2);
BEGIN
    -- Calcular maestría
    v_maestria := calcular_maestria_bloque(NEW.user_id, NEW.block_id);

    -- Contar preguntas del bloque
    SELECT COUNT(*) INTO v_total_preguntas
    FROM questions WHERE block_id = NEW.block_id;

    -- Contar preguntas vistas por el usuario
    SELECT COUNT(DISTINCT question_id) INTO v_preguntas_vistas
    FROM historial_respuestas
    WHERE user_id = NEW.user_id AND block_id = NEW.block_id;

    -- Calcular racha actual (correctas consecutivas)
    WITH ranked_answers AS (
        SELECT fue_correcta,
               ROW_NUMBER() OVER (ORDER BY fecha_respuesta DESC) as rn
        FROM historial_respuestas
        WHERE user_id = NEW.user_id AND block_id = NEW.block_id
    )
    SELECT COUNT(*) INTO v_racha_actual
    FROM ranked_answers
    WHERE fue_correcta = true AND rn <= (
        SELECT MIN(rn)
        FROM ranked_answers
        WHERE fue_correcta = false
    );

    -- Calcular tasas de acierto
    SELECT
        ROUND(AVG(CASE WHEN fue_correcta THEN 100.0 ELSE 0.0 END), 2),
        ROUND(
            (SELECT AVG(CASE WHEN fue_correcta THEN 100.0 ELSE 0.0 END)
             FROM (
                 SELECT fue_correcta
                 FROM historial_respuestas
                 WHERE user_id = NEW.user_id AND block_id = NEW.block_id
                 ORDER BY fecha_respuesta DESC
                 LIMIT 20
             ) recent),
            2
        )
    INTO v_tasa_global, v_tasa_reciente
    FROM historial_respuestas
    WHERE user_id = NEW.user_id AND block_id = NEW.block_id;

    -- Determinar estado
    v_estado := determinar_estado_bloque(v_maestria, v_preguntas_vistas);

    -- Insertar o actualizar evolucion_bloque
    INSERT INTO evolucion_bloque (
        user_id, block_id, maestria, total_preguntas, preguntas_vistas,
        estado, primera_interaccion, ultima_interaccion,
        racha_actual, racha_maxima, tasa_acierto_global, tasa_acierto_reciente,
        updated_at
    )
    VALUES (
        NEW.user_id, NEW.block_id, v_maestria, v_total_preguntas, v_preguntas_vistas,
        v_estado, NOW(), NOW(),
        v_racha_actual, v_racha_actual, v_tasa_global, v_tasa_reciente,
        NOW()
    )
    ON CONFLICT (user_id, block_id) DO UPDATE SET
        maestria = v_maestria,
        total_preguntas = v_total_preguntas,
        preguntas_vistas = v_preguntas_vistas,
        estado = v_estado,
        ultima_interaccion = NOW(),
        racha_actual = v_racha_actual,
        racha_maxima = GREATEST(evolucion_bloque.racha_maxima, v_racha_actual),
        tasa_acierto_global = v_tasa_global,
        tasa_acierto_reciente = v_tasa_reciente,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_evolucion ON historial_respuestas;
CREATE TRIGGER trigger_actualizar_evolucion
    AFTER INSERT ON historial_respuestas
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_evolucion_bloque();

COMMENT ON TRIGGER trigger_actualizar_evolucion ON historial_respuestas IS
'Actualiza automáticamente la tabla evolucion_bloque después de cada respuesta registrada.';

-- ===================================================================
-- PARTE 6: VISTAS MATERIALIZADAS PARA PERFORMANCE
-- ===================================================================

-- Vista materializada: Ranking de maestría por bloque
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_ranking_maestria AS
SELECT
    eb.block_id,
    b.name as block_name,
    eb.user_id,
    u.nickname,
    eb.maestria,
    eb.estado,
    eb.tiempo_total_estudio,
    RANK() OVER (PARTITION BY eb.block_id ORDER BY eb.maestria DESC) as ranking,
    eb.updated_at
FROM evolucion_bloque eb
JOIN blocks b ON eb.block_id = b.id
JOIN users u ON eb.user_id = u.id
WHERE eb.estado != 'no_iniciado'
ORDER BY eb.block_id, eb.maestria DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_ranking_unique
    ON mv_ranking_maestria(block_id, user_id);

CREATE INDEX IF NOT EXISTS idx_mv_ranking_block
    ON mv_ranking_maestria(block_id, ranking);

-- Vista materializada: Estadísticas globales de bloques
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_estadisticas_bloques AS
SELECT
    b.id as block_id,
    b.name as block_name,
    COUNT(DISTINCT eb.user_id) as total_usuarios,
    COUNT(*) FILTER (WHERE eb.estado = 'completado' OR eb.estado = 'maestro') as usuarios_completaron,
    ROUND(AVG(eb.maestria), 2) as maestria_promedio,
    ROUND(AVG(eb.tiempo_total_estudio), 2) as tiempo_promedio_minutos,
    COUNT(DISTINCT hr.question_id) as preguntas_intentadas,
    ROUND(AVG(CASE WHEN hr.fue_correcta THEN 100.0 ELSE 0.0 END), 2) as tasa_acierto_global,
    MAX(eb.updated_at) as ultima_actividad
FROM blocks b
LEFT JOIN evolucion_bloque eb ON b.id = eb.block_id
LEFT JOIN historial_respuestas hr ON b.id = hr.block_id
WHERE eb.estado != 'no_iniciado' OR eb.estado IS NULL
GROUP BY b.id, b.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stats_block
    ON mv_estadisticas_bloques(block_id);

COMMENT ON MATERIALIZED VIEW mv_estadisticas_bloques IS
'Estadísticas agregadas de cada bloque para dashboards. Refrescar cada hora.';

-- ===================================================================
-- PARTE 7: MIGRACIÓN DE DATOS HISTÓRICOS
-- Migra datos de user_profiles.answer_history (JSONB) a historial_respuestas
-- ===================================================================

-- Función de migración (ejecutar UNA SOLA VEZ después de crear las tablas)
CREATE OR REPLACE FUNCTION migrate_answer_history_to_historial()
RETURNS TABLE (
    users_procesados INTEGER,
    respuestas_migradas INTEGER,
    errores INTEGER
) AS $$
DECLARE
    v_users_procesados INTEGER := 0;
    v_respuestas_migradas INTEGER := 0;
    v_errores INTEGER := 0;
    user_record RECORD;
    answer_record JSONB;
BEGIN
    RAISE NOTICE 'Iniciando migración de answer_history a historial_respuestas...';

    -- Iterar sobre usuarios con historial
    FOR user_record IN
        SELECT id, answer_history
        FROM user_profiles
        WHERE answer_history IS NOT NULL
            AND jsonb_array_length(answer_history) > 0
    LOOP
        BEGIN
            v_users_procesados := v_users_procesados + 1;

            -- Iterar sobre cada respuesta en el JSONB
            FOR answer_record IN
                SELECT * FROM jsonb_array_elements(user_record.answer_history)
            LOOP
                BEGIN
                    -- Insertar en historial_respuestas
                    INSERT INTO historial_respuestas (
                        user_id,
                        question_id,
                        answer_id,
                        block_id,
                        game_id,
                        fue_correcta,
                        tiempo_respuesta,
                        modo_juego,
                        fecha_respuesta
                    )
                    VALUES (
                        user_record.id,
                        NULLIF((answer_record->>'questionId'), '')::INTEGER,
                        NULLIF((answer_record->>'answerId'), '')::INTEGER,
                        NULLIF((answer_record->>'blockId'), '')::INTEGER,
                        NULLIF((answer_record->>'gameId'), '')::INTEGER,
                        COALESCE((answer_record->>'isCorrect')::BOOLEAN, false),
                        NULLIF((answer_record->>'timeSpent'), '')::INTEGER,
                        COALESCE(answer_record->>'gameType', 'unknown'),
                        COALESCE(
                            (answer_record->>'timestamp')::TIMESTAMPTZ,
                            NOW()
                        )
                    )
                    ON CONFLICT DO NOTHING; -- evitar duplicados si se ejecuta múltiples veces

                    v_respuestas_migradas := v_respuestas_migradas + 1;

                EXCEPTION WHEN OTHERS THEN
                    v_errores := v_errores + 1;
                    RAISE WARNING 'Error migrando respuesta para user %: %',
                        user_record.id, SQLERRM;
                END;
            END LOOP;

            -- Log de progreso cada 100 usuarios
            IF v_users_procesados % 100 = 0 THEN
                RAISE NOTICE 'Procesados % usuarios, % respuestas migradas',
                    v_users_procesados, v_respuestas_migradas;
            END IF;

        EXCEPTION WHEN OTHERS THEN
            v_errores := v_errores + 1;
            RAISE WARNING 'Error procesando usuario %: %', user_record.id, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '=== MIGRACIÓN COMPLETADA ===';
    RAISE NOTICE 'Usuarios procesados: %', v_users_procesados;
    RAISE NOTICE 'Respuestas migradas: %', v_respuestas_migradas;
    RAISE NOTICE 'Errores: %', v_errores;

    RETURN QUERY SELECT v_users_procesados, v_respuestas_migradas, v_errores;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- PARTE 8: INICIALIZAR EVOLUCIÓN DE BLOQUES PARA USUARIOS EXISTENTES
-- ===================================================================

CREATE OR REPLACE FUNCTION inicializar_evolucion_bloques_existentes()
RETURNS TABLE (
    bloques_inicializados INTEGER
) AS $$
DECLARE
    v_bloques_inicializados INTEGER := 0;
BEGIN
    RAISE NOTICE 'Inicializando evolucion_bloque para combinaciones user-block existentes...';

    -- Insertar registros para todas las combinaciones user-block que tienen historial
    INSERT INTO evolucion_bloque (
        user_id,
        block_id,
        maestria,
        estado,
        primera_interaccion,
        ultima_interaccion,
        created_at,
        updated_at
    )
    SELECT DISTINCT
        hr.user_id,
        hr.block_id,
        calcular_maestria_bloque(hr.user_id, hr.block_id),
        'en_progreso',
        MIN(hr.fecha_respuesta),
        MAX(hr.fecha_respuesta),
        NOW(),
        NOW()
    FROM historial_respuestas hr
    WHERE NOT EXISTS (
        SELECT 1 FROM evolucion_bloque eb
        WHERE eb.user_id = hr.user_id AND eb.block_id = hr.block_id
    )
    GROUP BY hr.user_id, hr.block_id
    ON CONFLICT (user_id, block_id) DO NOTHING;

    GET DIAGNOSTICS v_bloques_inicializados = ROW_COUNT;

    RAISE NOTICE 'Bloques inicializados: %', v_bloques_inicializados;

    RETURN QUERY SELECT v_bloques_inicializados;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- PARTE 9: FUNCIONES DE UTILIDAD PARA LA API
-- ===================================================================

-- Obtener resumen completo de evolución de un usuario
CREATE OR REPLACE FUNCTION obtener_resumen_evolucion_usuario(p_user_id INTEGER)
RETURNS TABLE (
    block_id INTEGER,
    block_name VARCHAR,
    maestria DECIMAL,
    estado VARCHAR,
    preguntas_vistas INTEGER,
    total_preguntas INTEGER,
    tiempo_estudio INTEGER,
    tasa_acierto DECIMAL,
    racha_maxima INTEGER,
    desbloqueado BOOLEAN,
    preguntas_dificiles JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        eb.block_id,
        b.name as block_name,
        eb.maestria,
        eb.estado,
        eb.preguntas_vistas,
        eb.total_preguntas,
        eb.tiempo_total_estudio as tiempo_estudio,
        eb.tasa_acierto_global as tasa_acierto,
        eb.racha_maxima,
        bloque_desbloqueado(p_user_id, eb.block_id) as desbloqueado,
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'question_id', pd.question_id,
                    'text', pd.text_question,
                    'intentos', pd.total_intentos,
                    'tasa_fallo', pd.tasa_fallo
                )
            )
            FROM obtener_preguntas_dificiles(p_user_id, eb.block_id, 5) pd
        ) as preguntas_dificiles
    FROM evolucion_bloque eb
    JOIN blocks b ON eb.block_id = b.id
    WHERE eb.user_id = p_user_id
    ORDER BY eb.maestria DESC, eb.ultima_interaccion DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar batch de respuestas (optimizada para fin de partida)
CREATE OR REPLACE FUNCTION registrar_respuestas_batch(
    p_user_id INTEGER,
    p_game_id INTEGER,
    p_respuestas JSONB  -- Array de objetos con estructura de respuesta
)
RETURNS INTEGER AS $$
DECLARE
    v_respuestas_insertadas INTEGER := 0;
    respuesta JSONB;
BEGIN
    -- Insertar todas las respuestas en batch
    FOR respuesta IN SELECT * FROM jsonb_array_elements(p_respuestas)
    LOOP
        INSERT INTO historial_respuestas (
            user_id,
            question_id,
            answer_id,
            block_id,
            game_id,
            fue_correcta,
            tiempo_respuesta,
            modo_juego,
            dificultad_pregunta,
            fecha_respuesta
        )
        VALUES (
            p_user_id,
            (respuesta->>'questionId')::INTEGER,
            (respuesta->>'answerId')::INTEGER,
            (respuesta->>'blockId')::INTEGER,
            p_game_id,
            (respuesta->>'isCorrect')::BOOLEAN,
            (respuesta->>'timeSpent')::INTEGER,
            respuesta->>'gameType',
            COALESCE((respuesta->>'difficulty')::INTEGER, 1),
            COALESCE(
                (respuesta->>'timestamp')::TIMESTAMPTZ,
                NOW()
            )
        );

        v_respuestas_insertadas := v_respuestas_insertadas + 1;
    END LOOP;

    RETURN v_respuestas_insertadas;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- PARTE 10: POLÍTICAS DE MANTENIMIENTO Y LIMPIEZA
-- ===================================================================

-- Función para limpiar historial antiguo (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION limpiar_historial_antiguo(p_dias_antiguedad INTEGER DEFAULT 730)
RETURNS INTEGER AS $$
DECLARE
    v_registros_eliminados INTEGER;
BEGIN
    -- Eliminar respuestas más antiguas que X días (default: 2 años)
    -- Mantener al menos las últimas 5 respuestas de cada pregunta por usuario

    WITH respuestas_a_mantener AS (
        SELECT historial_id
        FROM (
            SELECT historial_id,
                   ROW_NUMBER() OVER (
                       PARTITION BY user_id, question_id
                       ORDER BY fecha_respuesta DESC
                   ) as rn
            FROM historial_respuestas
        ) ranked
        WHERE rn <= 5
    ),
    respuestas_recientes AS (
        SELECT historial_id
        FROM historial_respuestas
        WHERE fecha_respuesta > NOW() - INTERVAL '1 day' * p_dias_antiguedad
    )
    DELETE FROM historial_respuestas
    WHERE historial_id NOT IN (SELECT historial_id FROM respuestas_a_mantener)
      AND historial_id NOT IN (SELECT historial_id FROM respuestas_recientes);

    GET DIAGNOSTICS v_registros_eliminados = ROW_COUNT;

    RAISE NOTICE 'Registros históricos eliminados: %', v_registros_eliminados;

    RETURN v_registros_eliminados;
END;
$$ LANGUAGE plpgsql;

-- Función para refrescar vistas materializadas
CREATE OR REPLACE FUNCTION refrescar_vistas_materializadas()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Refrescando vistas materializadas...';

    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_ranking_maestria;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_estadisticas_bloques;

    RAISE NOTICE 'Vistas materializadas refrescadas correctamente';
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- COMMIT Y MENSAJES FINALES
-- ===================================================================

COMMIT;

-- ===================================================================
-- INSTRUCCIONES POST-INSTALACIÓN
-- ===================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║  SISTEMA DE SEGUIMIENTO Y EVOLUCIÓN - INSTALADO CORRECTAMENTE ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Tablas creadas:';
    RAISE NOTICE '   - historial_respuestas (con 6 índices optimizados)';
    RAISE NOTICE '   - evolucion_bloque (con 5 índices)';
    RAISE NOTICE '   - block_prerequisites';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Funciones creadas:';
    RAISE NOTICE '   - calcular_maestria_bloque()';
    RAISE NOTICE '   - determinar_estado_bloque()';
    RAISE NOTICE '   - bloque_desbloqueado()';
    RAISE NOTICE '   - obtener_preguntas_dificiles()';
    RAISE NOTICE '   - obtener_resumen_evolucion_usuario()';
    RAISE NOTICE '   - registrar_respuestas_batch()';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Triggers creados:';
    RAISE NOTICE '   - trigger_actualizar_evolucion (automático después de cada respuesta)';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Vistas materializadas:';
    RAISE NOTICE '   - mv_ranking_maestria';
    RAISE NOTICE '   - mv_estadisticas_bloques';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASOS (ejecutar en este orden):';
    RAISE NOTICE '';
    RAISE NOTICE '1️⃣  MIGRAR DATOS HISTÓRICOS (si tienes datos existentes):';
    RAISE NOTICE '    SELECT * FROM migrate_answer_history_to_historial();';
    RAISE NOTICE '';
    RAISE NOTICE '2️⃣  INICIALIZAR EVOLUCIÓN DE BLOQUES:';
    RAISE NOTICE '    SELECT * FROM inicializar_evolucion_bloques_existentes();';
    RAISE NOTICE '';
    RAISE NOTICE '3️⃣  REFRESCAR VISTAS MATERIALIZADAS:';
    RAISE NOTICE '    SELECT refrescar_vistas_materializadas();';
    RAISE NOTICE '';
    RAISE NOTICE '📊 MANTENIMIENTO RECOMENDADO:';
    RAISE NOTICE '   - Ejecutar refrescar_vistas_materializadas() cada hora';
    RAISE NOTICE '   - Ejecutar limpiar_historial_antiguo() cada mes';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 INTEGRACIÓN CON BACKEND:';
    RAISE NOTICE '   - Endpoints nuevos necesarios (ver documentación)';
    RAISE NOTICE '   - Modificar lógica de fin de partida para usar registrar_respuestas_batch()';
    RAISE NOTICE '   - Integrar obtener_resumen_evolucion_usuario() en panel del profesor';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- Verificación final
DO $$
DECLARE
    v_tablas_creadas INTEGER;
    v_funciones_creadas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_tablas_creadas
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('historial_respuestas', 'evolucion_bloque', 'block_prerequisites');

    SELECT COUNT(*) INTO v_funciones_creadas
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name LIKE '%maestria%' OR routine_name LIKE '%evolucion%';

    IF v_tablas_creadas = 3 THEN
        RAISE NOTICE '✅ Verificación: Las 3 tablas se crearon correctamente';
    ELSE
        RAISE WARNING '⚠️  Solo se crearon % de 3 tablas esperadas', v_tablas_creadas;
    END IF;

    IF v_funciones_creadas >= 5 THEN
        RAISE NOTICE '✅ Verificación: Funciones creadas correctamente (%)  ', v_funciones_creadas;
    ELSE
        RAISE WARNING '⚠️  Solo se crearon % funciones', v_funciones_creadas;
    END IF;
END $$;

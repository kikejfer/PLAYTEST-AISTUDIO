-- =====================================================
-- TRIGGER DE DESBLOQUEO AUTOMÁTICO DE BLOQUES
-- =====================================================
-- Desbloquea automáticamente el siguiente bloque cuando
-- el usuario alcanza 80% de dominio en el actual
-- =====================================================

-- Función para desbloquear el siguiente bloque automáticamente
CREATE OR REPLACE FUNCTION auto_unlock_next_block()
RETURNS TRIGGER AS $$
DECLARE
    v_next_block_id INTEGER;
    v_next_bloque_orden INTEGER;
    v_current_orden INTEGER;
BEGIN
    -- Solo proceder si:
    -- 1. El progreso alcanzó o superó 80%
    -- 2. El bloque actual no estaba previamente en 80%+ (para evitar triggers repetidos)
    IF NEW.porcentaje_progreso >= 80 AND (OLD.porcentaje_progreso IS NULL OR OLD.porcentaje_progreso < 80) THEN

        -- Obtener el orden del bloque actual
        SELECT orden
        INTO v_current_orden
        FROM cronograma_bloques
        WHERE id = NEW.id;

        -- Buscar el siguiente bloque en el cronograma
        SELECT id, orden
        INTO v_next_block_id, v_next_bloque_orden
        FROM cronograma_bloques
        WHERE cronograma_id = NEW.cronograma_id
        AND orden = v_current_orden + 1
        LIMIT 1;

        -- Si existe un siguiente bloque, habilitarlo
        IF v_next_block_id IS NOT NULL THEN
            UPDATE cronograma_bloques
            SET
                habilitado = TRUE,
                fecha_inicio_prevista = CASE
                    WHEN fecha_inicio_prevista IS NULL THEN CURRENT_DATE
                    ELSE fecha_inicio_prevista
                END
            WHERE id = v_next_block_id;

            -- Log del desbloqueo automático
            RAISE NOTICE 'Bloque % desbloqueado automáticamente para cronograma %',
                v_next_block_id, NEW.cronograma_id;

            -- Insertar notificación para el usuario
            INSERT INTO push_notifications_log (user_id, title, body, data, provider, player_ids, success)
            SELECT
                ca.alumno_id,
                '🎓 ¡Nuevo bloque desbloqueado!',
                format('Has completado el bloque actual con %s%% de progreso. El siguiente bloque ya está disponible.', NEW.porcentaje_progreso),
                jsonb_build_object(
                    'type', 'block_unlocked',
                    'block_id', v_next_block_id,
                    'cronograma_id', NEW.cronograma_id,
                    'action', 'open_block'
                ),
                'system',
                '[]'::jsonb,
                false
            FROM cronograma_alumno ca
            WHERE ca.id = NEW.cronograma_id;

        ELSE
            -- Es el último bloque, marcar cronograma como completado
            UPDATE cronograma_alumno
            SET
                porcentaje_progreso = 100,
                estado = 'completado'
            WHERE id = NEW.cronograma_id;

            RAISE NOTICE 'Cronograma % completado al 100%% (último bloque alcanzó 80%%)', NEW.cronograma_id;

            -- Notificación de finalización completa
            INSERT INTO push_notifications_log (user_id, title, body, data, provider, player_ids, success)
            SELECT
                ca.alumno_id,
                '🎉 ¡Oposición completada!',
                format('Has completado todos los bloques con éxito. ¡Felicitaciones!'),
                jsonb_build_object(
                    'type', 'course_completed',
                    'cronograma_id', NEW.cronograma_id,
                    'action', 'open_achievements'
                ),
                'system',
                '[]'::jsonb,
                false
            FROM cronograma_alumno ca
            WHERE ca.id = NEW.cronograma_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger en cronograma_bloques
DROP TRIGGER IF EXISTS trigger_auto_unlock_next_block ON cronograma_bloques;

CREATE TRIGGER trigger_auto_unlock_next_block
AFTER UPDATE OF porcentaje_progreso ON cronograma_bloques
FOR EACH ROW
WHEN (NEW.porcentaje_progreso >= 80)
EXECUTE FUNCTION auto_unlock_next_block();

-- =====================================================
-- FUNCIÓN AUXILIAR: Recalcular progreso de cronograma general
-- =====================================================

-- Función para recalcular el progreso general del cronograma del alumno
CREATE OR REPLACE FUNCTION recalcular_progreso_cronograma()
RETURNS TRIGGER AS $$
DECLARE
    v_progreso_promedio DECIMAL;
    v_total_bloques INTEGER;
    v_bloques_completados INTEGER;
    v_nuevo_estado VARCHAR(20);
    v_diferencia_porcentual DECIMAL;
    v_fecha_objetivo DATE;
    v_dias_restantes INTEGER;
    v_bloques_restantes INTEGER;
BEGIN
    -- Calcular progreso promedio de todos los bloques
    SELECT
        COALESCE(AVG(porcentaje_progreso), 0),
        COUNT(*),
        COUNT(*) FILTER (WHERE porcentaje_progreso >= 80)
    INTO v_progreso_promedio, v_total_bloques, v_bloques_completados
    FROM cronograma_bloques
    WHERE cronograma_id = NEW.cronograma_id;

    -- Obtener fecha objetivo
    SELECT fecha_objetivo
    INTO v_fecha_objetivo
    FROM cronograma_alumno
    WHERE id = NEW.cronograma_id;

    -- Calcular días restantes
    v_dias_restantes := v_fecha_objetivo - CURRENT_DATE;
    v_bloques_restantes := v_total_bloques - v_bloques_completados;

    -- Calcular estado basado en progreso vs tiempo
    IF v_dias_restantes <= 0 THEN
        v_nuevo_estado := 'retrasado';
        v_diferencia_porcentual := -100;
    ELSIF v_bloques_restantes = 0 THEN
        v_nuevo_estado := 'completado';
        v_diferencia_porcentual := 100;
    ELSE
        -- Calcular si va adelantado o retrasado
        -- Progreso esperado = (días transcurridos / días totales) * 100
        DECLARE
            v_dias_totales INTEGER;
            v_dias_transcurridos INTEGER;
            v_progreso_esperado DECIMAL;
        BEGIN
            SELECT
                fecha_objetivo - fecha_inscripcion,
                CURRENT_DATE - fecha_inscripcion
            INTO v_dias_totales, v_dias_transcurridos
            FROM cronograma_alumno
            WHERE id = NEW.cronograma_id;

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
    END IF;

    -- Actualizar cronograma del alumno
    UPDATE cronograma_alumno
    SET
        porcentaje_progreso = ROUND(v_progreso_promedio, 2),
        estado = v_nuevo_estado,
        diferencia_porcentual = ROUND(v_diferencia_porcentual, 2)
    WHERE id = NEW.cronograma_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para recalcular progreso general
DROP TRIGGER IF EXISTS trigger_recalcular_progreso_cronograma ON cronograma_bloques;

CREATE TRIGGER trigger_recalcular_progreso_cronograma
AFTER UPDATE OF porcentaje_progreso ON cronograma_bloques
FOR EACH ROW
EXECUTE FUNCTION recalcular_progreso_cronograma();

-- =====================================================
-- FUNCIÓN PARA MARCAR BLOQUE COMO COMPLETADO
-- =====================================================

-- Función que los endpoints pueden llamar para marcar progreso
CREATE OR REPLACE FUNCTION marcar_bloque_completado(
    p_cronograma_id INTEGER,
    p_bloque_id INTEGER,
    p_porcentaje_progreso DECIMAL
)
RETURNS TABLE(
    success BOOLEAN,
    next_block_unlocked BOOLEAN,
    next_block_id INTEGER,
    message TEXT
) AS $$
DECLARE
    v_next_block_id INTEGER;
    v_next_block_unlocked BOOLEAN := FALSE;
BEGIN
    -- Actualizar progreso del bloque
    UPDATE cronograma_bloques
    SET
        porcentaje_progreso = p_porcentaje_progreso,
        completado = CASE WHEN p_porcentaje_progreso >= 80 THEN TRUE ELSE completado END,
        fecha_fin_real = CASE WHEN p_porcentaje_progreso >= 80 THEN CURRENT_DATE ELSE fecha_fin_real END
    WHERE cronograma_id = p_cronograma_id
    AND bloque_id = p_bloque_id;

    -- Verificar si se desbloqueó siguiente bloque
    IF p_porcentaje_progreso >= 80 THEN
        SELECT cb.bloque_id
        INTO v_next_block_id
        FROM cronograma_bloques cb
        WHERE cb.cronograma_id = p_cronograma_id
        AND cb.orden = (
            SELECT orden + 1
            FROM cronograma_bloques
            WHERE cronograma_id = p_cronograma_id
            AND bloque_id = p_bloque_id
        )
        AND cb.habilitado = TRUE
        LIMIT 1;

        IF v_next_block_id IS NOT NULL THEN
            v_next_block_unlocked := TRUE;
        END IF;
    END IF;

    RETURN QUERY SELECT
        TRUE,
        v_next_block_unlocked,
        v_next_block_id,
        CASE
            WHEN v_next_block_unlocked THEN 'Bloque completado y siguiente desbloqueado'
            WHEN p_porcentaje_progreso >= 80 THEN 'Bloque completado (último del cronograma)'
            ELSE 'Progreso actualizado'
        END::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_unlock_next_block IS 'Desbloquea automáticamente el siguiente bloque al alcanzar 80% de dominio';
COMMENT ON FUNCTION recalcular_progreso_cronograma IS 'Recalcula el progreso general del cronograma del alumno';
COMMENT ON FUNCTION marcar_bloque_completado IS 'Marca un bloque como completado y retorna información sobre desbloqueos';

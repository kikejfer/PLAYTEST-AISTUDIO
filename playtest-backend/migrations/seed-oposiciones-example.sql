-- ==========================================
-- SEED DATA: Ejemplo de Oposición con Bloques y Temas
-- Descripción: Datos de ejemplo para poblar una oposición completa
-- Usar después de ejecutar la migración reorganize-to-oposiciones-model.sql
-- ==========================================

BEGIN;

-- ==========================================
-- NOTA: Ajustar estos IDs según tu base de datos
-- ==========================================
-- Asumiendo:
--   - Profesor con id = 1
--   - Alumnos con id = 2, 3, 4

-- ==========================================
-- PASO 1: CREAR OPOSICIÓN DE EJEMPLO
-- ==========================================

INSERT INTO oposiciones (
    profesor_id,
    nombre_oposicion,
    codigo_acceso,
    descripcion,
    academic_year,
    fecha_oposicion_sugerida,
    is_active,
    start_date,
    end_date
) VALUES (
    1, -- ID del profesor (AJUSTAR)
    'Auxiliar Administrativo del Estado 2025',
    'AUX-2025-A3F7',
    'Preparación completa para la oposición de Auxiliar Administrativo del Estado - Convocatoria 2025',
    '2025',
    '2025-06-15', -- Fecha sugerida del examen
    true,
    CURRENT_DATE,
    '2025-06-15'
)
ON CONFLICT (codigo_acceso) DO NOTHING;

-- Obtener ID de la oposición (para usar en los siguientes inserts)
DO $$
DECLARE
    oposicion_id INTEGER;
BEGIN
    SELECT id INTO oposicion_id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';
    RAISE NOTICE 'Oposición creada con ID: %', oposicion_id;
END $$;

-- ==========================================
-- PASO 2: CREAR BLOQUES DE TEMAS
-- ==========================================

-- BLOQUE 1: Constitución Española
INSERT INTO bloques_temas (oposicion_id, nombre, descripcion, orden, tiempo_estimado_dias)
SELECT id, 'Constitución Española', 'Estudio completo de la Constitución Española de 1978', 1, 14
FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

-- BLOQUE 2: Derecho Administrativo
INSERT INTO bloques_temas (oposicion_id, nombre, descripcion, orden, tiempo_estimado_dias)
SELECT id, 'Derecho Administrativo', 'Procedimiento administrativo común, actos y recursos', 2, 21
FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

-- BLOQUE 3: Ofimática y TICs
INSERT INTO bloques_temas (oposicion_id, nombre, descripcion, orden, tiempo_estimado_dias)
SELECT id, 'Ofimática y Tecnologías de la Información', 'Word, Excel, redes, seguridad informática', 3, 14
FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

-- BLOQUE 4: Organización del Estado
INSERT INTO bloques_temas (oposicion_id, nombre, descripcion, orden, tiempo_estimado_dias)
SELECT id, 'Organización del Estado y Administraciones Públicas', 'Estructura del Estado, CCAA, Administración Local', 4, 14
FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

-- BLOQUE 5: Atención al Ciudadano
INSERT INTO bloques_temas (oposicion_id, nombre, descripcion, orden, tiempo_estimado_dias)
SELECT id, 'Atención al Ciudadano y Gestión Documental', 'Registro, archivo, protección de datos', 5, 10
FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

-- ==========================================
-- PASO 3: CREAR TEMAS DENTRO DE LOS BLOQUES
-- ==========================================

-- TEMAS DEL BLOQUE 1: Constitución Española
INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Título Preliminar', 'Principios generales, símbolos, organización territorial', 1
FROM bloques_temas WHERE nombre = 'Constitución Española' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Derechos y Libertades Fundamentales', 'Título I: Derechos y deberes fundamentales', 2
FROM bloques_temas WHERE nombre = 'Constitución Española' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'La Corona', 'Título II: Funciones y prerrogativas del Rey', 3
FROM bloques_temas WHERE nombre = 'Constitución Española' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Las Cortes Generales', 'Título III: Congreso, Senado, elaboración de leyes', 4
FROM bloques_temas WHERE nombre = 'Constitución Española' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Gobierno y Administración', 'Título IV y V: Gobierno, Tribunal Constitucional', 5
FROM bloques_temas WHERE nombre = 'Constitución Española' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Reforma Constitucional', 'Título X: Procedimiento de reforma', 6
FROM bloques_temas WHERE nombre = 'Constitución Española' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

-- TEMAS DEL BLOQUE 2: Derecho Administrativo
INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Procedimiento Administrativo Común', 'Ley 39/2015: fases, plazos, tramitación', 1
FROM bloques_temas WHERE nombre = 'Derecho Administrativo' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Actos Administrativos', 'Validez, eficacia, nulidad, anulabilidad', 2
FROM bloques_temas WHERE nombre = 'Derecho Administrativo' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Recursos Administrativos', 'Alzada, reposición, extraordinaria revisión', 3
FROM bloques_temas WHERE nombre = 'Derecho Administrativo' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Silencio Administrativo', 'Positivo, negativo, efectos jurídicos', 4
FROM bloques_temas WHERE nombre = 'Derecho Administrativo' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Responsabilidad Patrimonial', 'Responsabilidad de las Administraciones Públicas', 5
FROM bloques_temas WHERE nombre = 'Derecho Administrativo' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

-- TEMAS DEL BLOQUE 3: Ofimática y TICs
INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Microsoft Word', 'Procesador de textos, formatos, estilos, tablas', 1
FROM bloques_temas WHERE nombre = 'Ofimática y Tecnologías de la Información' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Microsoft Excel', 'Hojas de cálculo, fórmulas, gráficos, tablas dinámicas', 2
FROM bloques_temas WHERE nombre = 'Ofimática y Tecnologías de la Información' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Redes y Comunicaciones', 'Internet, correo electrónico, navegadores', 3
FROM bloques_temas WHERE nombre = 'Ofimática y Tecnologías de la Información' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Seguridad Informática', 'Protección de datos, antivirus, copias de seguridad', 4
FROM bloques_temas WHERE nombre = 'Ofimática y Tecnologías de la Información' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

-- TEMAS DEL BLOQUE 4: Organización del Estado
INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Poder Ejecutivo', 'Gobierno, Presidente, Ministros, estructura', 1
FROM bloques_temas WHERE nombre = 'Organización del Estado y Administraciones Públicas' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Comunidades Autónomas', 'Distribución competencias, estatutos autonomía', 2
FROM bloques_temas WHERE nombre = 'Organización del Estado y Administraciones Públicas' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Administración Local', 'Municipios, provincias, órganos gobierno', 3
FROM bloques_temas WHERE nombre = 'Organización del Estado y Administraciones Públicas' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

-- TEMAS DEL BLOQUE 5: Atención al Ciudadano
INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Registro y Archivo', 'Sistemas de registro, archivo documental, SIA', 1
FROM bloques_temas WHERE nombre = 'Atención al Ciudadano y Gestión Documental' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Protección de Datos (RGPD)', 'Ley Orgánica 3/2018, derechos ARCO, consentimiento', 2
FROM bloques_temas WHERE nombre = 'Atención al Ciudadano y Gestión Documental' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

INSERT INTO temas (bloque_id, nombre, descripcion, orden)
SELECT id, 'Atención e Información al Ciudadano', 'Técnicas de atención, registro electrónico', 3
FROM bloques_temas WHERE nombre = 'Atención al Ciudadano y Gestión Documental' AND oposicion_id = (SELECT id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7');

-- ==========================================
-- PASO 4: INSCRIBIR ALUMNOS DE EJEMPLO (OPCIONAL)
-- ==========================================

-- Inscribir alumno con id = 2 (AJUSTAR ID)
INSERT INTO class_enrollments (oposicion_id, alumno_id, enrollment_status, enrollment_date, last_activity)
SELECT id, 2, 'active', CURRENT_DATE, NOW()
FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7'
ON CONFLICT (oposicion_id, alumno_id) DO NOTHING;

-- Inscribir alumno con id = 3 (AJUSTAR ID)
INSERT INTO class_enrollments (oposicion_id, alumno_id, enrollment_status, enrollment_date, last_activity)
SELECT id, 3, 'active', CURRENT_DATE, NOW()
FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7'
ON CONFLICT (oposicion_id, alumno_id) DO NOTHING;

-- ==========================================
-- PASO 5: GENERAR CRONOGRAMAS DE EJEMPLO
-- ==========================================

-- Generar cronograma para alumno 2 (fecha objetivo: 15 junio 2025)
DO $$
DECLARE
    oposicion_id INTEGER;
BEGIN
    SELECT id INTO oposicion_id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

    -- Solo generar si el alumno existe
    IF EXISTS (SELECT 1 FROM users WHERE id = 2) THEN
        PERFORM generar_cronograma_alumno(2, oposicion_id, '2025-06-15'::DATE);
        RAISE NOTICE 'Cronograma generado para alumno 2';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo generar cronograma para alumno 2: %', SQLERRM;
END $$;

-- Generar cronograma para alumno 3 (fecha objetivo: 1 julio 2025)
DO $$
DECLARE
    oposicion_id INTEGER;
BEGIN
    SELECT id INTO oposicion_id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

    IF EXISTS (SELECT 1 FROM users WHERE id = 3) THEN
        PERFORM generar_cronograma_alumno(3, oposicion_id, '2025-07-01'::DATE);
        RAISE NOTICE 'Cronograma generado para alumno 3';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'No se pudo generar cronograma para alumno 3: %', SQLERRM;
END $$;

-- ==========================================
-- VERIFICACIÓN FINAL
-- ==========================================

DO $$
DECLARE
    oposicion_id INTEGER;
    bloques_count INTEGER;
    temas_count INTEGER;
    cronogramas_count INTEGER;
BEGIN
    SELECT id INTO oposicion_id FROM oposiciones WHERE codigo_acceso = 'AUX-2025-A3F7';

    SELECT COUNT(*) INTO bloques_count FROM bloques_temas WHERE oposicion_id = oposicion_id;
    SELECT COUNT(*) INTO temas_count FROM temas t
        JOIN bloques_temas bt ON t.bloque_id = bt.id
        WHERE bt.oposicion_id = oposicion_id;
    SELECT COUNT(*) INTO cronogramas_count FROM cronograma_alumno WHERE oposicion_id = oposicion_id;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DATOS DE EJEMPLO CREADOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Oposición: Auxiliar Administrativo 2025';
    RAISE NOTICE 'Código acceso: AUX-2025-A3F7';
    RAISE NOTICE 'Bloques creados: %', bloques_count;
    RAISE NOTICE 'Temas creados: %', temas_count;
    RAISE NOTICE 'Alumnos con cronograma: %', cronogramas_count;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

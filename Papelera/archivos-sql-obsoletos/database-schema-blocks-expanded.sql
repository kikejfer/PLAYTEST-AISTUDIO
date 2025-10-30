-- Expansión del esquema de bloques para metadatos avanzados
-- Sistema de gestión de visibilidad y observaciones del autor

-- 1. Tabla de áreas de conocimiento predefinidas
CREATE TABLE IF NOT EXISTS knowledge_areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES knowledge_areas(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar áreas de conocimiento principales
INSERT INTO knowledge_areas (name, description) VALUES
('Ciencias Exactas', 'Matemáticas, Física, Química'),
('Ciencias Naturales', 'Biología, Geología, Medicina'),
('Ciencias Sociales', 'Historia, Geografía, Sociología'),
('Humanidades', 'Filosofía, Literatura, Arte'),
('Tecnología', 'Informática, Ingeniería, Telecomunicaciones'),
('Idiomas', 'Lenguas extranjeras y comunicación'),
('Derecho', 'Jurisprudencia y legislación'),
('Economía', 'Finanzas, Administración, Contabilidad'),
('Educación', 'Pedagogía y métodos educativos'),
('Salud', 'Medicina, Enfermería, Farmacia'),
('Deportes', 'Educación física y deportes'),
('Arte y Diseño', 'Bellas artes, diseño gráfico, música'),
('Oposiciones', 'Preparación para oposiciones públicas'),
('Certificaciones', 'Certificaciones profesionales y técnicas'),
('Otros', 'Otras áreas no clasificadas')
ON CONFLICT (name) DO NOTHING;

-- 2. Tabla de palabras clave (tags)
CREATE TABLE IF NOT EXISTS block_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de relación bloques-tags (muchos a muchos)
CREATE TABLE IF NOT EXISTS block_tag_relations (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES block_tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id, tag_id)
);

-- 4. Tabla de historial de estados de bloques
CREATE TABLE IF NOT EXISTS block_state_history (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    previous_state VARCHAR(20),
    new_state VARCHAR(20) NOT NULL,
    changed_by INTEGER REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ampliar tabla blocks con nuevos campos
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS detailed_description TEXT;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS block_type VARCHAR(30) DEFAULT 'Otro';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS education_level VARCHAR(30) DEFAULT 'Universidad';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS scope VARCHAR(30) DEFAULT 'Local';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS knowledge_area_id INTEGER REFERENCES knowledge_areas(id);
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'Intermedio';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS content_language VARCHAR(10) DEFAULT 'es';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS author_observations TEXT;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS block_state VARCHAR(20) DEFAULT 'private';
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS publication_date TIMESTAMP;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS last_state_change TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Actualizar is_public para que sea consistente con block_state
UPDATE blocks SET block_state = CASE 
    WHEN is_public = true THEN 'public'
    ELSE 'private'
END WHERE block_state IS NULL;

-- 6. Función para actualizar contadores de tags
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE block_tags 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE block_tags 
        SET usage_count = GREATEST(usage_count - 1, 0) 
        WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para mantener contadores de tags actualizados
DROP TRIGGER IF EXISTS trigger_update_tag_usage ON block_tag_relations;
CREATE TRIGGER trigger_update_tag_usage
    AFTER INSERT OR DELETE ON block_tag_relations
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- 7. Función para registrar cambios de estado
CREATE OR REPLACE FUNCTION log_block_state_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.block_state IS DISTINCT FROM NEW.block_state THEN
        INSERT INTO block_state_history (block_id, previous_state, new_state, changed_by)
        VALUES (NEW.id, OLD.block_state, NEW.block_state, NEW.creator_id);
        
        -- Si se publica por primera vez, establecer fecha de publicación
        IF NEW.block_state = 'public' AND OLD.block_state != 'public' THEN
            NEW.publication_date = NOW();
        END IF;
        
        NEW.last_state_change = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging de cambios de estado
DROP TRIGGER IF EXISTS trigger_log_state_change ON blocks;
CREATE TRIGGER trigger_log_state_change
    BEFORE UPDATE ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION log_block_state_change();

-- 8. Vista para bloques con información completa
CREATE OR REPLACE VIEW blocks_complete_info AS
SELECT 
    b.id,
    b.name,
    b.detailed_description,
    b.description as short_description,
    b.block_type,
    b.education_level,
    b.scope,
    b.difficulty_level,
    b.content_language,
    b.author_observations,
    b.block_state,
    b.is_public,
    b.publication_date,
    b.last_state_change,
    b.view_count,
    b.download_count,
    b.average_rating,
    b.rating_count,
    b.created_at,
    b.updated_at,
    
    -- Información del creador
    u.nickname as creator_nickname,
    u.email as creator_email,
    
    -- Área de conocimiento
    ka.name as knowledge_area_name,
    ka.description as knowledge_area_description,
    
    -- Estadísticas del bloque
    COALESCE(q_stats.question_count, 0) as question_count,
    COALESCE(q_stats.topic_count, 0) as topic_count,
    COALESCE(b.total_users, 0) as user_count,
    
    -- Tags como array
    COALESCE(
        array_agg(DISTINCT bt.name ORDER BY bt.name) FILTER (WHERE bt.name IS NOT NULL),
        ARRAY[]::VARCHAR[]
    ) as tags,
    
    -- Historial de estados más recientes
    (SELECT json_agg(
        json_build_object(
            'previous_state', bsh.previous_state,
            'new_state', bsh.new_state,
            'changed_at', bsh.created_at,
            'change_reason', bsh.change_reason
        ) ORDER BY bsh.created_at DESC
    ) FROM block_state_history bsh WHERE bsh.block_id = b.id LIMIT 5) as state_history

FROM blocks b
LEFT JOIN users u ON b.creator_id = u.id
LEFT JOIN knowledge_areas ka ON b.knowledge_area_id = ka.id
LEFT JOIN block_tag_relations btr ON b.id = btr.block_id
LEFT JOIN block_tags bt ON btr.tag_id = bt.id
LEFT JOIN (
    SELECT 
        block_id,
        COUNT(*) as question_count,
        COUNT(DISTINCT topic) as topic_count
    FROM questions
    GROUP BY block_id
) q_stats ON b.id = q_stats.block_id
GROUP BY 
    b.id, b.name, b.detailed_description, b.description, b.block_type,
    b.education_level, b.scope, b.difficulty_level, b.content_language,
    b.author_observations, b.block_state, b.is_public, b.publication_date,
    b.last_state_change, b.view_count, b.download_count, b.average_rating,
    b.rating_count, b.created_at, b.updated_at, u.nickname, u.email,
    ka.name, ka.description, q_stats.question_count, q_stats.topic_count, b.total_users;

-- 9. Función para búsqueda avanzada con filtros
CREATE OR REPLACE FUNCTION search_blocks_advanced(
    p_search_text TEXT DEFAULT NULL,
    p_block_type VARCHAR(30) DEFAULT NULL,
    p_education_level VARCHAR(30) DEFAULT NULL,
    p_scope VARCHAR(30) DEFAULT NULL,
    p_knowledge_area_id INTEGER DEFAULT NULL,
    p_difficulty_level VARCHAR(20) DEFAULT NULL,
    p_content_language VARCHAR(10) DEFAULT NULL,
    p_tags TEXT[] DEFAULT NULL,
    p_creator_id INTEGER DEFAULT NULL,
    p_min_rating DECIMAL DEFAULT NULL,
    p_block_state VARCHAR(20) DEFAULT 'public',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    name VARCHAR(100),
    detailed_description TEXT,
    short_description TEXT,
    block_type VARCHAR(30),
    education_level VARCHAR(30),
    scope VARCHAR(30),
    difficulty_level VARCHAR(20),
    content_language VARCHAR(10),
    creator_nickname VARCHAR(50),
    knowledge_area_name VARCHAR(100),
    question_count BIGINT,
    topic_count BIGINT,
    user_count INTEGER,
    tags VARCHAR[],
    average_rating DECIMAL(3,2),
    rating_count INTEGER,
    publication_date TIMESTAMP,
    relevance_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bci.id,
        bci.name,
        bci.detailed_description,
        bci.short_description,
        bci.block_type,
        bci.education_level,
        bci.scope,
        bci.difficulty_level,
        bci.content_language,
        bci.creator_nickname,
        bci.knowledge_area_name,
        bci.question_count,
        bci.topic_count,
        bci.user_count,
        bci.tags,
        bci.average_rating,
        bci.rating_count,
        bci.publication_date,
        -- Calcular relevancia basada en múltiples factores
        (
            CASE WHEN p_search_text IS NOT NULL THEN
                (
                    CASE WHEN bci.name ILIKE '%' || p_search_text || '%' THEN 3.0 ELSE 0.0 END +
                    CASE WHEN bci.detailed_description ILIKE '%' || p_search_text || '%' THEN 2.0 ELSE 0.0 END +
                    CASE WHEN bci.author_observations ILIKE '%' || p_search_text || '%' THEN 1.5 ELSE 0.0 END +
                    CASE WHEN array_to_string(bci.tags, ' ') ILIKE '%' || p_search_text || '%' THEN 2.5 ELSE 0.0 END
                )
            ELSE 1.0 END +
            (bci.average_rating * 0.5) +
            (LOG(GREATEST(bci.user_count, 1)) * 0.3) +
            (LOG(GREATEST(bci.question_count, 1)) * 0.2)
        )::FLOAT as relevance_score
    FROM blocks_complete_info bci
    WHERE 
        (p_block_state IS NULL OR bci.block_state = p_block_state)
        AND (p_search_text IS NULL OR (
            bci.name ILIKE '%' || p_search_text || '%' OR
            bci.detailed_description ILIKE '%' || p_search_text || '%' OR
            bci.author_observations ILIKE '%' || p_search_text || '%' OR
            array_to_string(bci.tags, ' ') ILIKE '%' || p_search_text || '%'
        ))
        AND (p_block_type IS NULL OR bci.block_type = p_block_type)
        AND (p_education_level IS NULL OR bci.education_level = p_education_level)
        AND (p_scope IS NULL OR bci.scope = p_scope)
        AND (p_knowledge_area_id IS NULL OR bci.id IN (
            SELECT b.id FROM blocks b WHERE b.knowledge_area_id = p_knowledge_area_id
        ))
        AND (p_difficulty_level IS NULL OR bci.difficulty_level = p_difficulty_level)
        AND (p_content_language IS NULL OR bci.content_language = p_content_language)
        AND (p_creator_id IS NULL OR bci.id IN (
            SELECT b.id FROM blocks b WHERE b.creator_id = p_creator_id
        ))
        AND (p_min_rating IS NULL OR bci.average_rating >= p_min_rating)
        AND (p_tags IS NULL OR bci.tags && p_tags)
    ORDER BY relevance_score DESC, bci.publication_date DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 10. Función para obtener sugerencias automáticas
CREATE OR REPLACE FUNCTION get_block_suggestions(
    p_knowledge_area_id INTEGER DEFAULT NULL,
    p_block_type VARCHAR(30) DEFAULT NULL,
    p_education_level VARCHAR(30) DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    suggestion_type VARCHAR(20),
    suggestion_value TEXT,
    usage_count INTEGER
) AS $$
BEGIN
    -- Sugerir tags populares en la misma área
    IF p_knowledge_area_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'tag'::VARCHAR(20) as suggestion_type,
            bt.name as suggestion_value,
            bt.usage_count
        FROM block_tags bt
        JOIN block_tag_relations btr ON bt.id = btr.tag_id
        JOIN blocks b ON btr.block_id = b.id
        WHERE b.knowledge_area_id = p_knowledge_area_id
        GROUP BY bt.id, bt.name, bt.usage_count
        ORDER BY bt.usage_count DESC
        LIMIT p_limit;
    END IF;
    
    -- Sugerir títulos similares
    IF p_block_type IS NOT NULL OR p_education_level IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'title'::VARCHAR(20) as suggestion_type,
            b.name as suggestion_value,
            b.view_count as usage_count
        FROM blocks b
        WHERE 
            (p_block_type IS NULL OR b.block_type = p_block_type)
            AND (p_education_level IS NULL OR b.education_level = p_education_level)
            AND b.block_state = 'public'
        ORDER BY b.view_count DESC
        LIMIT p_limit;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- 11. Índices para optimizar búsquedas
CREATE INDEX IF NOT EXISTS idx_blocks_state ON blocks(block_state);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(block_type);
CREATE INDEX IF NOT EXISTS idx_blocks_education_level ON blocks(education_level);
CREATE INDEX IF NOT EXISTS idx_blocks_scope ON blocks(scope);
CREATE INDEX IF NOT EXISTS idx_blocks_difficulty ON blocks(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_blocks_knowledge_area ON blocks(knowledge_area_id);
CREATE INDEX IF NOT EXISTS idx_blocks_language ON blocks(content_language);
CREATE INDEX IF NOT EXISTS idx_blocks_rating ON blocks(average_rating);
CREATE INDEX IF NOT EXISTS idx_blocks_publication_date ON blocks(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_blocks_text_search ON blocks USING gin(to_tsvector('spanish', COALESCE(name, '') || ' ' || COALESCE(detailed_description, '') || ' ' || COALESCE(author_observations, '')));

-- Índices para tags
CREATE INDEX IF NOT EXISTS idx_block_tags_usage ON block_tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_block_tag_relations_block ON block_tag_relations(block_id);
CREATE INDEX IF NOT EXISTS idx_block_tag_relations_tag ON block_tag_relations(tag_id);

-- Índices para historial
CREATE INDEX IF NOT EXISTS idx_block_state_history_block ON block_state_history(block_id, created_at DESC);

-- 12. Función para validar bloque antes de publicación
CREATE OR REPLACE FUNCTION validate_block_for_publication(p_block_id INTEGER)
RETURNS TABLE (
    is_valid BOOLEAN,
    missing_fields TEXT[],
    warnings TEXT[]
) AS $$
DECLARE
    block_data RECORD;
    missing_list TEXT[] := ARRAY[]::TEXT[];
    warning_list TEXT[] := ARRAY[]::TEXT[];
BEGIN
    SELECT * INTO block_data
    FROM blocks_complete_info
    WHERE id = p_block_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, ARRAY['Bloque no encontrado'], ARRAY[]::TEXT[];
        RETURN;
    END IF;
    
    -- Validar campos obligatorios
    IF block_data.name IS NULL OR length(trim(block_data.name)) = 0 THEN
        missing_list := array_append(missing_list, 'Nombre del bloque');
    END IF;
    
    IF block_data.detailed_description IS NULL OR length(trim(block_data.detailed_description)) < 50 THEN
        missing_list := array_append(missing_list, 'Descripción detallada (mínimo 50 caracteres)');
    END IF;
    
    IF block_data.question_count = 0 THEN
        missing_list := array_append(missing_list, 'Al menos una pregunta');
    END IF;
    
    IF block_data.knowledge_area_name IS NULL THEN
        missing_list := array_append(missing_list, 'Área de conocimiento');
    END IF;
    
    -- Generar advertencias
    IF block_data.question_count < 10 THEN
        warning_list := array_append(warning_list, 'Pocos contenidos: menos de 10 preguntas');
    END IF;
    
    IF array_length(block_data.tags, 1) IS NULL OR array_length(block_data.tags, 1) < 3 THEN
        warning_list := array_append(warning_list, 'Recomendado: añadir al menos 3 tags para mejor descubrimiento');
    END IF;
    
    IF block_data.author_observations IS NULL OR length(trim(block_data.author_observations)) < 100 THEN
        warning_list := array_append(warning_list, 'Recomendado: añadir observaciones del autor para guiar a los usuarios');
    END IF;
    
    RETURN QUERY SELECT 
        (array_length(missing_list, 1) IS NULL OR array_length(missing_list, 1) = 0),
        missing_list,
        warning_list;
END;
$$ LANGUAGE plpgsql;
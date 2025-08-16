-- ==========================================
-- ESQUEMA DE BASE DE DATOS - INTEGRACIONES EXTERNAS
-- Sistema de conectores para LMS, SIS y otras plataformas educativas
-- ==========================================

-- TABLA: Configuraciones de integración
CREATE TABLE IF NOT EXISTS integration_configurations (
    id SERIAL PRIMARY KEY,
    
    -- Información básica de la integración
    integration_type VARCHAR(50) NOT NULL, -- 'lms', 'sis', 'assessment', 'communication'
    integration_name VARCHAR(200) NOT NULL,
    provider_name VARCHAR(100) NOT NULL, -- 'Canvas', 'Moodle', 'Blackboard', 'PowerSchool', etc.
    
    -- Configuración de conexión
    base_url TEXT NOT NULL,
    api_version VARCHAR(20),
    api_endpoint_prefix VARCHAR(100),
    
    -- Credenciales (encriptadas)
    credentials JSONB, -- API keys, tokens, certificados, etc.
    authentication_type VARCHAR(50), -- 'api_key', 'oauth2', 'basic_auth', 'certificate'
    
    -- Configuración de sincronización
    sync_frequency INTEGER DEFAULT 3600, -- segundos entre sincronizaciones automáticas
    sync_direction VARCHAR(20) DEFAULT 'bidirectional', -- 'import', 'export', 'bidirectional'
    
    -- Mapeo de campos
    field_mappings JSONB, -- Mapeo entre campos locales y externos
    data_filters JSONB, -- Filtros para importación/exportación
    
    -- Configuraciones específicas
    sync_settings JSONB, -- Configuraciones específicas del proveedor
    rate_limits JSONB, -- Límites de velocidad de API
    error_handling JSONB, -- Configuración de manejo de errores
    
    -- Estado y monitoreo
    is_active BOOLEAN DEFAULT true,
    last_sync_attempt TIMESTAMP,
    last_successful_sync TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0,
    
    -- Métricas
    total_sync_operations INTEGER DEFAULT 0,
    total_records_processed INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Operaciones de sincronización
CREATE TABLE IF NOT EXISTS sync_operations (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER REFERENCES integration_configurations(id) ON DELETE CASCADE,
    
    -- Información de la operación
    operation_type VARCHAR(50) NOT NULL, -- 'student_sync', 'grade_sync', 'course_sync', etc.
    operation_direction VARCHAR(20) NOT NULL, -- 'import', 'export'
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Estado y resultados
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'partial'
    error_message TEXT,
    
    -- Estadísticas
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    
    -- Detalles de la operación
    sync_details JSONB, -- Detalles específicos de la sincronización
    filter_criteria JSONB, -- Criterios de filtrado aplicados
    
    -- Performance
    processing_time_ms INTEGER,
    api_calls_made INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Mapeo de IDs externos
CREATE TABLE IF NOT EXISTS external_id_mappings (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER REFERENCES integration_configurations(id) ON DELETE CASCADE,
    
    -- Mapeo de identificadores
    local_table VARCHAR(100) NOT NULL, -- Tabla local (users, teacher_classes, etc.)
    local_record_id INTEGER NOT NULL,
    external_id VARCHAR(200) NOT NULL,
    external_type VARCHAR(50), -- Tipo de objeto externo
    
    -- Metadatos
    mapping_data JSONB, -- Datos adicionales del mapeo
    confidence_score DECIMAL(3,2), -- Confianza en el mapeo (0-1)
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    verified_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(integration_id, local_table, local_record_id),
    UNIQUE(integration_id, external_id, external_type)
);

-- TABLA: Log de datos sincronizados
CREATE TABLE IF NOT EXISTS sync_data_log (
    id SERIAL PRIMARY KEY,
    sync_operation_id INTEGER REFERENCES sync_operations(id) ON DELETE CASCADE,
    
    -- Información del registro
    record_type VARCHAR(50) NOT NULL, -- 'student', 'grade', 'course', etc.
    local_record_id INTEGER,
    external_record_id VARCHAR(200),
    
    -- Acción realizada
    action VARCHAR(20) NOT NULL, -- 'create', 'update', 'delete', 'skip'
    action_reason TEXT,
    
    -- Datos
    old_data JSONB, -- Datos anteriores (para updates)
    new_data JSONB, -- Datos nuevos
    field_changes JSONB, -- Campos específicos que cambiaron
    
    -- Estado
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'skipped'
    error_details TEXT,
    
    -- Timing
    processed_at TIMESTAMP DEFAULT NOW(),
    processing_duration_ms INTEGER
);

-- TABLA: Webhooks de integración
CREATE TABLE IF NOT EXISTS integration_webhooks (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER REFERENCES integration_configurations(id) ON DELETE CASCADE,
    
    -- Configuración del webhook
    webhook_url TEXT NOT NULL,
    webhook_secret VARCHAR(200), -- Para verificación de firma
    event_types JSONB, -- Tipos de eventos que trigger el webhook
    
    -- Configuración HTTP
    http_method VARCHAR(10) DEFAULT 'POST',
    headers JSONB, -- Headers adicionales
    payload_template JSONB, -- Template del payload
    
    -- Configuración de reintento
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP,
    last_successful_trigger TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Log de webhooks
CREATE TABLE IF NOT EXISTS webhook_log (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER REFERENCES integration_webhooks(id) ON DELETE CASCADE,
    
    -- Información del evento
    event_type VARCHAR(100) NOT NULL,
    trigger_data JSONB, -- Datos que triggerearon el webhook
    
    -- Request details
    request_url TEXT,
    request_headers JSONB,
    request_payload JSONB,
    
    -- Response details
    response_status_code INTEGER,
    response_headers JSONB,
    response_body TEXT,
    
    -- Timing
    triggered_at TIMESTAMP DEFAULT NOW(),
    response_time_ms INTEGER,
    
    -- Estado
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);

-- TABLA: Cache de datos externos
CREATE TABLE IF NOT EXISTS external_data_cache (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER REFERENCES integration_configurations(id) ON DELETE CASCADE,
    
    -- Identificación del cache
    cache_key VARCHAR(500) NOT NULL,
    data_type VARCHAR(100) NOT NULL, -- 'student_list', 'course_info', etc.
    
    -- Datos cacheados
    cached_data JSONB NOT NULL,
    data_hash VARCHAR(64), -- Hash para verificar cambios
    
    -- Metadatos
    cache_metadata JSONB, -- Metadatos adicionales
    
    -- Expiración
    expires_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT NOW(),
    access_count INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(integration_id, cache_key)
);

-- TABLA: Configuraciones de transformación de datos
CREATE TABLE IF NOT EXISTS data_transformations (
    id SERIAL PRIMARY KEY,
    integration_id INTEGER REFERENCES integration_configurations(id) ON DELETE CASCADE,
    
    -- Información de la transformación
    transformation_name VARCHAR(200) NOT NULL,
    data_type VARCHAR(100) NOT NULL, -- 'student', 'grade', 'course', etc.
    direction VARCHAR(20) NOT NULL, -- 'import', 'export'
    
    -- Reglas de transformación
    transformation_rules JSONB NOT NULL, -- Reglas de mapeo y transformación
    validation_rules JSONB, -- Reglas de validación
    default_values JSONB, -- Valores por defecto
    
    -- Configuración
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Orden de aplicación
    
    -- Estadísticas
    applied_count INTEGER DEFAULT 0,
    last_applied TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ========================================

-- Índices para configuraciones de integración
CREATE INDEX IF NOT EXISTS idx_integration_configurations_type ON integration_configurations(integration_type, is_active);
CREATE INDEX IF NOT EXISTS idx_integration_configurations_provider ON integration_configurations(provider_name, is_active);
CREATE INDEX IF NOT EXISTS idx_integration_configurations_sync ON integration_configurations(last_sync_attempt, sync_frequency) 
    WHERE is_active = true;

-- Índices para operaciones de sincronización
CREATE INDEX IF NOT EXISTS idx_sync_operations_integration ON sync_operations(integration_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_operations_type ON sync_operations(operation_type, started_at);
CREATE INDEX IF NOT EXISTS idx_sync_operations_status ON sync_operations(status, started_at);

-- Índices para mapeo de IDs
CREATE INDEX IF NOT EXISTS idx_external_id_mappings_local ON external_id_mappings(local_table, local_record_id);
CREATE INDEX IF NOT EXISTS idx_external_id_mappings_external ON external_id_mappings(integration_id, external_id);
CREATE INDEX IF NOT EXISTS idx_external_id_mappings_active ON external_id_mappings(integration_id, is_active);

-- Índices para log de datos
CREATE INDEX IF NOT EXISTS idx_sync_data_log_operation ON sync_data_log(sync_operation_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_data_log_record ON sync_data_log(record_type, local_record_id);
CREATE INDEX IF NOT EXISTS idx_sync_data_log_external ON sync_data_log(external_record_id);

-- Índices para webhooks
CREATE INDEX IF NOT EXISTS idx_integration_webhooks_integration ON integration_webhooks(integration_id, is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_log_webhook ON webhook_log(webhook_id, triggered_at);
CREATE INDEX IF NOT EXISTS idx_webhook_log_status ON webhook_log(status, triggered_at);

-- Índices para cache
CREATE INDEX IF NOT EXISTS idx_external_data_cache_integration ON external_data_cache(integration_id, data_type);
CREATE INDEX IF NOT EXISTS idx_external_data_cache_key ON external_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_external_data_cache_expires ON external_data_cache(expires_at) 
    WHERE expires_at IS NOT NULL;

-- Índices para transformaciones
CREATE INDEX IF NOT EXISTS idx_data_transformations_integration ON data_transformations(integration_id, data_type, direction);
CREATE INDEX IF NOT EXISTS idx_data_transformations_active ON data_transformations(is_active, priority);

-- ========================================
-- FUNCIONES DE UTILIDAD
-- ========================================

-- Función para limpiar cache expirado
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM external_data_cache 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de integración
CREATE OR REPLACE FUNCTION get_integration_stats(integration_id_param INTEGER)
RETURNS JSONB AS $$
DECLARE
    stats JSONB;
    total_operations INTEGER;
    successful_operations INTEGER;
    failed_operations INTEGER;
    avg_processing_time DECIMAL;
    last_sync TIMESTAMP;
BEGIN
    -- Calcular estadísticas de operaciones
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'completed' THEN 1 END),
        COUNT(CASE WHEN status = 'failed' THEN 1 END),
        AVG(processing_time_ms),
        MAX(completed_at)
    INTO total_operations, successful_operations, failed_operations, avg_processing_time, last_sync
    FROM sync_operations
    WHERE integration_id = integration_id_param
    AND started_at >= NOW() - INTERVAL '30 days';

    -- Construir JSON de estadísticas
    stats := jsonb_build_object(
        'total_operations', COALESCE(total_operations, 0),
        'successful_operations', COALESCE(successful_operations, 0),
        'failed_operations', COALESCE(failed_operations, 0),
        'success_rate', CASE 
            WHEN total_operations > 0 THEN 
                ROUND((successful_operations::DECIMAL / total_operations) * 100, 2)
            ELSE 0 
        END,
        'avg_processing_time_ms', COALESCE(avg_processing_time, 0),
        'last_sync', last_sync,
        'calculated_at', NOW()
    );

    RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar mapeo de ID externo
CREATE OR REPLACE FUNCTION upsert_external_mapping(
    p_integration_id INTEGER,
    p_local_table VARCHAR(100),
    p_local_record_id INTEGER,
    p_external_id VARCHAR(200),
    p_external_type VARCHAR(50),
    p_mapping_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO external_id_mappings (
        integration_id, local_table, local_record_id, 
        external_id, external_type, mapping_data
    ) VALUES (
        p_integration_id, p_local_table, p_local_record_id,
        p_external_id, p_external_type, p_mapping_data
    )
    ON CONFLICT (integration_id, local_table, local_record_id)
    DO UPDATE SET
        external_id = EXCLUDED.external_id,
        external_type = EXCLUDED.external_type,
        mapping_data = EXCLUDED.mapping_data,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS
-- ========================================

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers a tablas relevantes
DO $$
DECLARE
    table_name TEXT;
    integration_tables TEXT[] := ARRAY[
        'integration_configurations', 'external_id_mappings', 
        'integration_webhooks', 'external_data_cache', 'data_transformations'
    ];
BEGIN
    FOREACH table_name IN ARRAY integration_tables
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %s;
            CREATE TRIGGER trigger_update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_integration_updated_at();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;

-- Trigger para limpiar cache automáticamente
CREATE OR REPLACE FUNCTION auto_cleanup_cache()
RETURNS TRIGGER AS $$
BEGIN
    -- Ejecutar limpieza cada 100 inserciones
    IF (TG_OP = 'INSERT') AND (NEW.id % 100 = 0) THEN
        PERFORM cleanup_expired_cache();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_cleanup_cache
    AFTER INSERT ON external_data_cache
    FOR EACH ROW
    EXECUTE FUNCTION auto_cleanup_cache();
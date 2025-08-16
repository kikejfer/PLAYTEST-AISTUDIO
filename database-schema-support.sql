-- Sistema de Soporte Técnico Avanzado para PLAYTEST
-- Incluye agrupación inteligente, escalado automático, base de conocimiento y analytics

-- ==================== TABLAS PRINCIPALES ====================

-- 1. Categorías de tickets
CREATE TABLE IF NOT EXISTS support_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6c757d', -- Color hex para UI
    is_active BOOLEAN DEFAULT true,
    parent_category_id INTEGER REFERENCES support_categories(id),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tickets principales
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- formato: SPT-YYYY-NNNNNN
    
    -- Información del usuario
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_email VARCHAR(255) NOT NULL,
    user_nickname VARCHAR(100) NOT NULL,
    
    -- Contenido del ticket
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES support_categories(id),
    
    -- Estado y prioridad
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed', 'escalated')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    
    -- Asignación
    assigned_to INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Agrupación inteligente
    group_id INTEGER REFERENCES support_ticket_groups(id),
    is_group_master BOOLEAN DEFAULT false, -- true si es el ticket principal del grupo
    
    -- Escalado automático
    escalation_level INTEGER DEFAULT 0, -- 0: sin escalar, 1: admin, 2: admin principal
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalation_reason TEXT,
    
    -- SLA y tiempos
    due_date TIMESTAMP WITH TIME ZONE,
    first_response_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métricas
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    satisfaction_comment TEXT,
    
    -- Metadatos técnicos
    browser_info JSONB DEFAULT '{}',
    device_info JSONB DEFAULT '{}',
    error_logs TEXT,
    screenshot_urls TEXT[], -- URLs de capturas de pantalla
    
    -- Machine Learning features
    ml_classification JSONB DEFAULT '{}', -- Resultados de clasificación automática
    ml_confidence DECIMAL(3,2), -- Confianza de la clasificación (0.00-1.00)
    similarity_hash VARCHAR(64), -- Hash para agrupación por similitud
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Grupos de tickets (agrupación inteligente)
CREATE TABLE IF NOT EXISTS support_ticket_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(255) NOT NULL,
    group_description TEXT,
    
    -- Características del grupo
    common_category_id INTEGER REFERENCES support_categories(id),
    common_issue_type VARCHAR(100),
    similarity_threshold DECIMAL(3,2) DEFAULT 0.75, -- Umbral de similitud para agrupación
    
    -- Estado del grupo
    group_status VARCHAR(20) DEFAULT 'active' CHECK (group_status IN ('active', 'resolved', 'archived')),
    group_priority VARCHAR(20) DEFAULT 'medium' CHECK (group_priority IN ('low', 'medium', 'high', 'critical', 'urgent')),
    
    -- Métricas del grupo
    total_tickets INTEGER DEFAULT 0,
    users_affected INTEGER DEFAULT 0,
    avg_resolution_time INTERVAL,
    
    -- Asignación del grupo
    assigned_to INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE,
    
    -- Resolución común
    common_resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Comentarios y respuestas
CREATE TABLE IF NOT EXISTS support_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- Autor del comentario
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('customer', 'agent', 'admin', 'system')),
    
    -- Contenido
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false, -- Solo visible para agentes
    is_solution BOOLEAN DEFAULT false, -- Marca la respuesta como solución
    
    -- Plantillas y automatización
    template_id INTEGER REFERENCES support_templates(id),
    is_automated BOOLEAN DEFAULT false,
    
    -- Adjuntos
    attachments JSONB DEFAULT '[]', -- URLs y metadatos de archivos adjuntos
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Plantillas de respuesta
CREATE TABLE IF NOT EXISTS support_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    content TEXT NOT NULL,
    
    -- Categorización
    category_id INTEGER REFERENCES support_categories(id),
    tags TEXT[] DEFAULT '{}',
    
    -- Control de uso
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by INTEGER NOT NULL REFERENCES users(id),
    
    -- Variables dinámicas en el template
    variables JSONB DEFAULT '{}', -- {{user_name}}, {{ticket_number}}, etc.
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Base de conocimiento
CREATE TABLE IF NOT EXISTS support_knowledge_base (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    summary TEXT, -- Resumen corto para búsquedas
    
    -- Categorización
    category_id INTEGER REFERENCES support_categories(id),
    tags TEXT[] DEFAULT '{}',
    
    -- Estado y visibilidad
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT false, -- Visible para usuarios finales
    
    -- Autor y revisión
    created_by INTEGER NOT NULL REFERENCES users(id),
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métricas de uso
    views_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    unhelpful_votes INTEGER DEFAULT 0,
    
    -- Versioning
    version INTEGER DEFAULT 1,
    previous_version_id INTEGER REFERENCES support_knowledge_base(id),
    
    -- Relacionado con tickets
    generated_from_tickets INTEGER[] DEFAULT '{}', -- IDs de tickets que generaron este artículo
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. FAQ automático
CREATE TABLE IF NOT EXISTS support_faq (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    
    -- Auto-generación desde tickets
    generated_from_tickets INTEGER[] DEFAULT '{}',
    occurrence_count INTEGER DEFAULT 1, -- Cuántas veces se ha preguntado esto
    
    -- Categorización
    category_id INTEGER REFERENCES support_categories(id),
    
    -- Estado
    is_published BOOLEAN DEFAULT false,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Métricas
    views_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Escalaciones automáticas
CREATE TABLE IF NOT EXISTS support_escalations (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- Datos de la escalación
    escalation_level INTEGER NOT NULL, -- 1: admin, 2: admin principal, 3: crítico
    escalation_reason TEXT NOT NULL,
    escalation_type VARCHAR(30) NOT NULL CHECK (escalation_type IN ('time_based', 'priority_based', 'complexity_based', 'manual')),
    
    -- Asignación anterior y nueva
    previous_assignee INTEGER REFERENCES users(id),
    new_assignee INTEGER REFERENCES users(id),
    
    -- Automatización
    is_automatic BOOLEAN DEFAULT true,
    triggered_by_rule VARCHAR(100), -- Nombre de la regla que disparó la escalación
    
    -- Resolución
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Reglas de escalación
CREATE TABLE IF NOT EXISTS support_escalation_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    
    -- Condiciones de activación
    conditions JSONB NOT NULL, -- {time_hours: 24, priority: ['high', 'critical'], category: [...]}
    
    -- Acciones a ejecutar
    actions JSONB NOT NULL, -- {escalate_to_level: 1, assign_to_role: 'admin', notify: [...]}
    
    -- Control
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Orden de evaluación de reglas
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Analytics y métricas
CREATE TABLE IF NOT EXISTS support_analytics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    
    -- Métricas diarias
    tickets_created INTEGER DEFAULT 0,
    tickets_resolved INTEGER DEFAULT 0,
    tickets_escalated INTEGER DEFAULT 0,
    
    -- Tiempos promedio (en minutos)
    avg_first_response_time INTEGER,
    avg_resolution_time INTEGER,
    
    -- Satisfacción
    avg_satisfaction_rating DECIMAL(3,2),
    total_ratings INTEGER DEFAULT 0,
    
    -- Por categoría
    category_stats JSONB DEFAULT '{}', -- {category_id: {created: N, resolved: N, avg_time: N}}
    
    -- Agentes
    agent_stats JSONB DEFAULT '{}', -- {agent_id: {tickets_handled: N, avg_rating: N}}
    
    -- Estado del sistema
    system_uptime_percentage DECIMAL(5,2),
    error_rate_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Notificaciones del sistema
CREATE TABLE IF NOT EXISTS support_notifications (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    
    -- Destinatario
    user_id INTEGER NOT NULL REFERENCES users(id),
    notification_type VARCHAR(50) NOT NULL, -- 'ticket_created', 'ticket_assigned', 'escalated', etc.
    
    -- Contenido
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Estado
    is_read BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Canales de envío
    send_email BOOLEAN DEFAULT true,
    send_push BOOLEAN DEFAULT true,
    send_sms BOOLEAN DEFAULT false,
    
    -- Prioridad
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Configuración del sistema
CREATE TABLE IF NOT EXISTS support_system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    config_type VARCHAR(20) DEFAULT 'string' CHECK (config_type IN ('string', 'integer', 'boolean', 'json')),
    
    -- Control
    is_editable BOOLEAN DEFAULT true,
    requires_restart BOOLEAN DEFAULT false,
    
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ÍNDICES PARA OPTIMIZACIÓN ====================

-- Índices principales
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category_id ON support_tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_group_id ON support_tickets(group_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_escalation_level ON support_tickets(escalation_level);
CREATE INDEX IF NOT EXISTS idx_support_tickets_similarity_hash ON support_tickets(similarity_hash);

-- Índices para comentarios
CREATE INDEX IF NOT EXISTS idx_support_comments_ticket_id ON support_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_comments_user_id ON support_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_support_comments_created_at ON support_comments(created_at);

-- Índices para grupos
CREATE INDEX IF NOT EXISTS idx_support_ticket_groups_status ON support_ticket_groups(group_status);
CREATE INDEX IF NOT EXISTS idx_support_ticket_groups_assigned_to ON support_ticket_groups(assigned_to);

-- Índices para analytics
CREATE INDEX IF NOT EXISTS idx_support_analytics_date ON support_analytics(metric_date);

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_support_notifications_user_id ON support_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_notifications_is_read ON support_notifications(is_read);

-- Índices para base de conocimiento
CREATE INDEX IF NOT EXISTS idx_support_knowledge_base_category_id ON support_knowledge_base(category_id);
CREATE INDEX IF NOT EXISTS idx_support_knowledge_base_status ON support_knowledge_base(status);
CREATE INDEX IF NOT EXISTS idx_support_knowledge_base_tags ON support_knowledge_base USING GIN(tags);

-- ==================== FUNCIONES STORED PROCEDURES ====================

-- Función para generar número de ticket único
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_number TEXT;
    ticket_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::TEXT;
    
    SELECT LPAD((COALESCE(MAX(
        CASE WHEN ticket_number LIKE 'SPT-' || current_year || '-%'
        THEN SUBSTRING(ticket_number FROM LENGTH('SPT-' || current_year || '-') + 1)::INTEGER
        ELSE 0 END
    ), 0) + 1)::TEXT, 6, '0')
    INTO next_number
    FROM support_tickets;
    
    ticket_number := 'SPT-' || current_year || '-' || next_number;
    
    RETURN ticket_number;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular hash de similitud de tickets
CREATE OR REPLACE FUNCTION calculate_ticket_similarity_hash(
    p_subject TEXT,
    p_description TEXT,
    p_category_id INTEGER
)
RETURNS VARCHAR(64) AS $$
DECLARE
    clean_text TEXT;
    hash_input TEXT;
BEGIN
    -- Limpiar y normalizar texto
    clean_text := LOWER(TRIM(REGEXP_REPLACE(p_subject || ' ' || p_description, '[^a-zA-Z0-9\s]', '', 'g')));
    clean_text := REGEXP_REPLACE(clean_text, '\s+', ' ', 'g');
    
    -- Crear input para hash incluyendo categoría
    hash_input := COALESCE(p_category_id::TEXT, '0') || '|' || clean_text;
    
    -- Generar hash MD5
    RETURN MD5(hash_input);
END;
$$ LANGUAGE plpgsql;

-- Función para auto-asignar tickets a grupos similares
CREATE OR REPLACE FUNCTION auto_assign_ticket_to_group(p_ticket_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    ticket_hash VARCHAR(64);
    similar_group_id INTEGER;
    ticket_category INTEGER;
    group_found BOOLEAN := false;
BEGIN
    -- Obtener datos del ticket
    SELECT similarity_hash, category_id INTO ticket_hash, ticket_category
    FROM support_tickets WHERE id = p_ticket_id;
    
    -- Buscar grupo con tickets similares
    SELECT tg.id INTO similar_group_id
    FROM support_ticket_groups tg
    JOIN support_tickets t ON t.group_id = tg.id
    WHERE t.similarity_hash = ticket_hash
      AND t.category_id = ticket_category
      AND tg.group_status = 'active'
    GROUP BY tg.id
    HAVING COUNT(*) > 0
    ORDER BY tg.created_at DESC
    LIMIT 1;
    
    -- Si encontramos un grupo similar, asignar el ticket
    IF similar_group_id IS NOT NULL THEN
        UPDATE support_tickets 
        SET group_id = similar_group_id, updated_at = NOW()
        WHERE id = p_ticket_id;
        
        -- Actualizar contador del grupo
        UPDATE support_ticket_groups 
        SET total_tickets = total_tickets + 1,
            users_affected = (
                SELECT COUNT(DISTINCT user_id) 
                FROM support_tickets 
                WHERE group_id = similar_group_id
            ),
            updated_at = NOW()
        WHERE id = similar_group_id;
        
        group_found := true;
    END IF;
    
    RETURN group_found;
END;
$$ LANGUAGE plpgsql;

-- Función para crear nuevo grupo automáticamente
CREATE OR REPLACE FUNCTION create_auto_group_for_ticket(p_ticket_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_group_id INTEGER;
    ticket_rec RECORD;
    group_name TEXT;
BEGIN
    -- Obtener datos del ticket
    SELECT * INTO ticket_rec FROM support_tickets WHERE id = p_ticket_id;
    
    -- Generar nombre descriptivo para el grupo
    group_name := 'Auto: ' || LEFT(ticket_rec.subject, 50) || 
                  CASE WHEN LENGTH(ticket_rec.subject) > 50 THEN '...' ELSE '' END;
    
    -- Crear nuevo grupo
    INSERT INTO support_ticket_groups (
        group_name, 
        group_description,
        common_category_id,
        total_tickets,
        users_affected,
        group_priority
    ) VALUES (
        group_name,
        'Grupo automático basado en similitud de tickets',
        ticket_rec.category_id,
        1,
        1,
        ticket_rec.priority
    ) RETURNING id INTO new_group_id;
    
    -- Asignar ticket al nuevo grupo y marcarlo como master
    UPDATE support_tickets 
    SET group_id = new_group_id, 
        is_group_master = true,
        updated_at = NOW()
    WHERE id = p_ticket_id;
    
    RETURN new_group_id;
END;
$$ LANGUAGE plpgsql;

-- Función para procesamiento automático de escalaciones
CREATE OR REPLACE FUNCTION process_automatic_escalations()
RETURNS INTEGER AS $$
DECLARE
    escalated_count INTEGER := 0;
    ticket_rec RECORD;
    rule_rec RECORD;
    time_diff INTEGER;
BEGIN
    -- Recorrer tickets activos que pueden necesitar escalación
    FOR ticket_rec IN 
        SELECT * FROM support_tickets 
        WHERE status IN ('open', 'in_progress', 'waiting_user')
          AND escalation_level < 2
    LOOP
        -- Evaluar reglas de escalación
        FOR rule_rec IN 
            SELECT * FROM support_escalation_rules 
            WHERE is_active = true 
            ORDER BY priority DESC
        LOOP
            -- Verificar condición de tiempo
            time_diff := EXTRACT(EPOCH FROM NOW() - ticket_rec.created_at) / 3600;
            
            -- Evaluar si el ticket cumple las condiciones de la regla
            IF (rule_rec.conditions->>'time_hours')::INTEGER <= time_diff
               AND (rule_rec.conditions->'priorities' ? ticket_rec.priority)
            THEN
                -- Ejecutar escalación
                UPDATE support_tickets 
                SET escalation_level = escalation_level + 1,
                    escalated_at = NOW(),
                    escalation_reason = 'Escalación automática: ' || rule_rec.rule_name,
                    updated_at = NOW()
                WHERE id = ticket_rec.id;
                
                -- Registrar escalación
                INSERT INTO support_escalations (
                    ticket_id, escalation_level, escalation_reason, 
                    escalation_type, is_automatic, triggered_by_rule
                ) VALUES (
                    ticket_rec.id, ticket_rec.escalation_level + 1, 
                    'Escalación automática por ' || rule_rec.rule_name,
                    'time_based', true, rule_rec.rule_name
                );
                
                escalated_count := escalated_count + 1;
                EXIT; -- Solo aplicar una regla por ticket
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN escalated_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGERS ====================

-- Trigger para actualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas principales
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_ticket_groups_updated_at BEFORE UPDATE ON support_ticket_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_comments_updated_at BEFORE UPDATE ON support_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_templates_updated_at BEFORE UPDATE ON support_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_knowledge_base_updated_at BEFORE UPDATE ON support_knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_categories_updated_at BEFORE UPDATE ON support_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auto-generar número de ticket
CREATE OR REPLACE FUNCTION auto_generate_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_ticket_number_trigger 
BEFORE INSERT ON support_tickets 
FOR EACH ROW EXECUTE FUNCTION auto_generate_ticket_number();

-- Trigger para calcular hash de similitud automáticamente
CREATE OR REPLACE FUNCTION auto_calculate_similarity_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.similarity_hash := calculate_ticket_similarity_hash(
        NEW.subject, 
        NEW.description, 
        NEW.category_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_similarity_hash_trigger 
BEFORE INSERT ON support_tickets 
FOR EACH ROW EXECUTE FUNCTION auto_calculate_similarity_hash();

-- Trigger para agrupación automática después de crear ticket
CREATE OR REPLACE FUNCTION auto_group_ticket()
RETURNS TRIGGER AS $$
BEGIN
    -- Intentar asignar a grupo existente
    IF NOT auto_assign_ticket_to_group(NEW.id) THEN
        -- Si no se encontró grupo similar, buscar otros tickets similares
        -- para crear un nuevo grupo
        IF (SELECT COUNT(*) FROM support_tickets 
            WHERE similarity_hash = NEW.similarity_hash 
              AND category_id = NEW.category_id 
              AND id != NEW.id
              AND group_id IS NULL) > 0 THEN
            
            -- Crear nuevo grupo automáticamente
            PERFORM create_auto_group_for_ticket(NEW.id);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_group_ticket_trigger 
AFTER INSERT ON support_tickets 
FOR EACH ROW EXECUTE FUNCTION auto_group_ticket();

-- ==================== DATOS INICIALES ====================

-- Categorías predefinidas
INSERT INTO support_categories (name, description, color, sort_order) VALUES
('Bugs del Sistema', 'Errores y fallos en la aplicación', '#dc3545', 1),
('Funcionalidad', 'Preguntas sobre cómo usar características', '#17a2b8', 2),
('Rendimiento', 'Problemas de velocidad y performance', '#ffc107', 3),
('Cuenta y Autenticación', 'Problemas de login, registro, perfiles', '#28a745', 4),
('Pagos y Facturación', 'Problemas con transacciones y luminarias', '#6f42c1', 5),
('Contenido', 'Problemas con quizzes, bloques, material', '#fd7e14', 6),
('Móvil/Responsive', 'Problemas específicos de dispositivos móviles', '#20c997', 7),
('Integración', 'Problemas con APIs y conexiones externas', '#6c757d', 8),
('Solicitudes', 'Nuevas características y mejoras', '#007bff', 9),
('Otro', 'Problemas no categorizados', '#868e96', 10)
ON CONFLICT (name) DO NOTHING;

-- Plantillas de respuesta predefinidas
INSERT INTO support_templates (name, subject, content, category_id, created_by, tags) VALUES
('Agradecimiento por Reporte', 'Gracias por reportar el problema', 
'Hola {{user_name}},\n\nGracias por contactar al soporte de PLAYTEST. Hemos recibido tu reporte sobre: {{ticket_subject}}\n\nNuestro equipo está revisando el problema y te contactaremos pronto con una solución.\n\nNúmero de ticket: {{ticket_number}}\n\nSaludos,\nEquipo de Soporte PLAYTEST', 
1, 1, ARRAY['agradecimiento', 'confirmación']),

('Solicitud de Información Adicional', 'Necesitamos más información - {{ticket_number}}', 
'Hola {{user_name}},\n\nPara poder ayudarte mejor con tu problema, necesitamos información adicional:\n\n- ¿Qué navegador estás usando?\n- ¿Puedes describir los pasos exactos que seguiste?\n- ¿Has intentado refrescar la página?\n- ¿Tienes alguna captura de pantalla del error?\n\nGracias por tu colaboración.\n\nSaludos,\nEquipo de Soporte PLAYTEST', 
1, 1, ARRAY['información', 'seguimiento']),

('Problema Resuelto', 'Tu problema ha sido resuelto - {{ticket_number}}', 
'Hola {{user_name}},\n\nNos complace informarte que hemos resuelto el problema reportado en tu ticket {{ticket_number}}.\n\nSolución aplicada: {{solution_description}}\n\nPor favor, verifica que todo funcione correctamente y no dudes en contactarnos si tienes alguna otra pregunta.\n\n¿Te gustaría calificar nuestro servicio?\n\nSaludos,\nEquipo de Soporte PLAYTEST', 
NULL, 1, ARRAY['resolución', 'cierre'])

ON CONFLICT DO NOTHING;

-- Reglas de escalación automática
INSERT INTO support_escalation_rules (rule_name, description, conditions, actions, priority) VALUES
('Escalación 24h Sin Respuesta', 'Escalar tickets sin respuesta después de 24 horas', 
'{"time_hours": 24, "priorities": ["medium", "high", "critical", "urgent"]}',
'{"escalate_to_level": 1, "assign_to_role": "admin", "notify": ["admin"]}', 
10),

('Escalación Crítica Inmediata', 'Escalación inmediata para problemas críticos', 
'{"time_hours": 0, "priorities": ["critical", "urgent"]}',
'{"escalate_to_level": 1, "assign_to_role": "admin", "notify": ["admin", "manager"]}', 
100),

('Escalación 48h Sin Resolución', 'Escalar a administrador principal después de 48h', 
'{"time_hours": 48, "priorities": ["high", "critical", "urgent"]}',
'{"escalate_to_level": 2, "assign_to_role": "admin_principal", "notify": ["admin_principal", "manager"]}', 
20)

ON CONFLICT (rule_name) DO NOTHING;

-- Configuración inicial del sistema
INSERT INTO support_system_config (config_key, config_value, description, config_type) VALUES
('auto_assignment_enabled', 'true', 'Habilitar asignación automática de tickets', 'boolean'),
('auto_escalation_enabled', 'true', 'Habilitar escalación automática', 'boolean'),
('max_escalation_level', '2', 'Nivel máximo de escalación', 'integer'),
('similarity_threshold', '0.75', 'Umbral de similitud para agrupación automática', 'string'),
('sla_first_response_hours', '4', 'SLA para primera respuesta (horas)', 'integer'),
('sla_resolution_hours', '24', 'SLA para resolución (horas)', 'integer'),
('notification_email_enabled', 'true', 'Habilitar notificaciones por email', 'boolean'),
('notification_push_enabled', 'true', 'Habilitar notificaciones push', 'boolean'),
('analytics_retention_days', '365', 'Días de retención de analytics', 'integer'),
('auto_close_resolved_days', '7', 'Días para cerrar automáticamente tickets resueltos', 'integer')

ON CONFLICT (config_key) DO NOTHING;

-- Crear índices adicionales para texto completo (búsqueda)
CREATE INDEX IF NOT EXISTS idx_support_tickets_subject_text ON support_tickets USING GIN(to_tsvector('spanish', subject));
CREATE INDEX IF NOT EXISTS idx_support_tickets_description_text ON support_tickets USING GIN(to_tsvector('spanish', description));
CREATE INDEX IF NOT EXISTS idx_support_knowledge_base_content_text ON support_knowledge_base USING GIN(to_tsvector('spanish', title || ' ' || content));

-- Crear vista para dashboard de métricas
CREATE OR REPLACE VIEW support_dashboard_metrics AS
SELECT 
    (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as open_tickets,
    (SELECT COUNT(*) FROM support_tickets WHERE status = 'escalated') as escalated_tickets,
    (SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) 
     FROM support_tickets 
     WHERE resolved_at IS NOT NULL 
       AND resolved_at >= NOW() - INTERVAL '30 days') as avg_resolution_hours,
    (SELECT AVG(satisfaction_rating) 
     FROM support_tickets 
     WHERE satisfaction_rating IS NOT NULL 
       AND resolved_at >= NOW() - INTERVAL '30 days') as avg_satisfaction,
    (SELECT COUNT(*) FROM support_tickets WHERE created_at >= CURRENT_DATE) as today_tickets,
    (SELECT COUNT(*) FROM support_tickets WHERE resolved_at >= CURRENT_DATE) as today_resolved,
    (SELECT COUNT(DISTINCT group_id) FROM support_tickets WHERE group_id IS NOT NULL AND status != 'closed') as active_groups;

COMMENT ON TABLE support_tickets IS 'Tabla principal de tickets de soporte con agrupación inteligente';
COMMENT ON TABLE support_ticket_groups IS 'Grupos automáticos de tickets similares';
COMMENT ON TABLE support_knowledge_base IS 'Base de conocimiento integrada con analytics';
COMMENT ON TABLE support_escalations IS 'Registro de escalaciones automáticas y manuales';
COMMENT ON FUNCTION process_automatic_escalations() IS 'Procesa escalaciones automáticas según reglas configuradas';
COMMENT ON VIEW support_dashboard_metrics IS 'Vista con métricas principales para el dashboard';
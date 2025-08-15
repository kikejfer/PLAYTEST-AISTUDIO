-- Sistema de Comunicación Interno PLAYTEST
-- Tickets + Chat integrado con asignación automática

-- Tabla de categorías de tickets
CREATE TABLE ticket_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    origin_type VARCHAR(20) NOT NULL, -- 'global' o 'block'
    priority VARCHAR(10) DEFAULT 'media', -- 'baja', 'media', 'alta'
    auto_escalate BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías predefinidas
INSERT INTO ticket_categories (name, origin_type, priority, auto_escalate, description) VALUES
-- Categorías globales (Soporte Técnico)
('Bug en interfaz general', 'global', 'alta', true, 'Errores en la interfaz principal del sistema'),
('Problema de rendimiento/carga', 'global', 'alta', true, 'Problemas de velocidad o carga del sistema'),
('Error con Luminarias/pagos', 'global', 'alta', true, 'Problemas con el sistema de luminarias o pagos'),
('Problema de acceso/login', 'global', 'alta', true, 'Dificultades para acceder al sistema'),
('Fallo en sistema de juego', 'global', 'alta', true, 'Errores durante las partidas'),
('Error en estadísticas globales', 'global', 'media', false, 'Problemas con estadísticas generales'),
('Solicitud de funcionalidad', 'global', 'baja', false, 'Sugerencias de nuevas funciones'),
('Ayuda general de uso', 'global', 'baja', false, 'Consultas sobre uso del sistema'),
('Problema con contenido de bloque específico', 'global', 'media', false, 'Redirección a formulario de bloque'),

-- Categorías por bloque
('Pregunta incorrecta/confusa', 'block', 'media', false, 'Preguntas con errores o ambigüedades'),
('Respuesta errónea', 'block', 'alta', false, 'Respuestas marcadas incorrectamente'),
('Falta información/contexto', 'block', 'media', false, 'Preguntas que necesitan más información'),
('Contenido inapropiado', 'block', 'alta', true, 'Contenido ofensivo o inapropiado'),
('Sugerencia de mejora', 'block', 'baja', false, 'Ideas para mejorar el contenido'),
('Solicitar nuevo tema', 'block', 'baja', false, 'Solicitud de nuevos temas en el bloque'),
('Problema con reto/torneo del bloque', 'block', 'media', false, 'Problemas específicos de competencia'),
('Error en estadísticas del bloque', 'block', 'media', false, 'Problemas con stats específicas del bloque'),
('Problema técnico general (no del bloque)', 'block', 'media', false, 'Redirección a soporte técnico global');

-- Tabla principal de tickets
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- TK-2024-000001
    origin_type VARCHAR(20) NOT NULL, -- 'global' o 'block'
    block_id INTEGER REFERENCES blocks(id), -- Solo si origin_type = 'block'
    category_id INTEGER REFERENCES ticket_categories(id) NOT NULL,
    
    -- Usuario y asignación
    created_by INTEGER REFERENCES users(id) NOT NULL,
    assigned_to INTEGER REFERENCES users(id), -- Asignado automáticamente
    escalated_to INTEGER REFERENCES users(id), -- Si se escala
    
    -- Contenido del ticket
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(10) NOT NULL DEFAULT 'media',
    
    -- Estados y control
    status VARCHAR(20) DEFAULT 'abierto', -- abierto, en_progreso, esperando_respuesta, resuelto, cerrado
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}', -- Info adicional como redirecciones, etc.
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    escalate_at TIMESTAMP -- Cuándo escalar si no hay respuesta
);

-- Tabla de mensajes del chat integrado
CREATE TABLE ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id INTEGER REFERENCES users(id) NOT NULL,
    
    -- Contenido del mensaje
    message_text TEXT NOT NULL,
    message_html TEXT, -- Para formateo markdown renderizado
    is_internal BOOLEAN DEFAULT false, -- Para notas internas de admins
    is_system BOOLEAN DEFAULT false, -- Mensajes automáticos del sistema
    
    -- Metadatos
    edited_at TIMESTAMP,
    read_by JSONB DEFAULT '{}', -- {user_id: timestamp} para marcar como leído
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de adjuntos
CREATE TABLE ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES ticket_messages(id) ON DELETE CASCADE,
    
    -- Info del archivo
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    
    -- Metadatos
    uploaded_by INTEGER REFERENCES users(id) NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_image BOOLEAN DEFAULT false,
    thumbnail_path VARCHAR(500) -- Para imágenes
);

-- Tabla de participantes en tickets (para control de acceso)
CREATE TABLE ticket_participants (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'creator', 'assigned', 'viewer', 'admin'
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notifications_enabled BOOLEAN DEFAULT true,
    UNIQUE(ticket_id, user_id)
);

-- Tabla de notificaciones
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    
    -- Contenido de la notificación
    type VARCHAR(50) NOT NULL, -- 'new_ticket', 'new_message', 'status_change', 'escalation'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    
    -- Control
    is_read BOOLEAN DEFAULT false,
    is_push_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Función para generar números de ticket únicos
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
    year_str TEXT := EXTRACT(YEAR FROM NOW())::TEXT;
    sequence_num INTEGER;
    ticket_num TEXT;
BEGIN
    -- Obtener el siguiente número en secuencia para este año
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(ticket_number FROM '\\d{4}-(\\d+)$') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM tickets 
    WHERE ticket_number LIKE 'TK-' || year_str || '-%';
    
    -- Formatear con ceros a la izquierda
    ticket_num := 'TK-' || year_str || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER trigger_auto_ticket_number
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_ticket_number();

-- Función de auto-asignación de tickets
CREATE OR REPLACE FUNCTION auto_assign_ticket()
RETURNS TRIGGER AS $$
DECLARE
    assigned_user_id INTEGER;
    admin_id INTEGER;
    creator_id INTEGER;
BEGIN
    -- Si es ticket global (soporte técnico)
    IF NEW.origin_type = 'global' THEN
        -- Buscar usuario con rol 'servicio_tecnico'
        SELECT u.id INTO assigned_user_id
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'servicio_tecnico'
        ORDER BY RANDOM() -- Si hay varios, asignar aleatoriamente
        LIMIT 1;
        
        -- Si no hay servicio técnico, asignar a AdminPrincipal
        IF assigned_user_id IS NULL THEN
            SELECT u.id INTO assigned_user_id
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'administrador_principal'
            LIMIT 1;
        END IF;
        
    -- Si es ticket de bloque específico
    ELSIF NEW.origin_type = 'block' AND NEW.block_id IS NOT NULL THEN
        -- Obtener el creador del bloque
        SELECT creator_id INTO assigned_user_id
        FROM blocks
        WHERE id = NEW.block_id;
        
        -- Si el creador no existe o es el mismo que reporta, asignar al admin del creador
        IF assigned_user_id IS NULL OR assigned_user_id = NEW.created_by THEN
            -- Buscar el admin asignado del creador del bloque
            SELECT b.creator_id INTO creator_id FROM blocks WHERE id = NEW.block_id;
            
            SELECT aa.admin_id INTO admin_id
            FROM admin_assignments aa
            WHERE aa.assigned_user_id = creator_id;
            
            IF admin_id IS NOT NULL THEN
                assigned_user_id := admin_id;
            ELSE
                -- Si no tiene admin asignado, usar AdminPrincipal
                SELECT u.id INTO assigned_user_id
                FROM users u
                JOIN user_roles ur ON u.id = ur.user_id
                JOIN roles r ON ur.role_id = r.id
                WHERE r.name = 'administrador_principal'
                LIMIT 1;
            END IF;
        END IF;
    END IF;
    
    NEW.assigned_to := assigned_user_id;
    
    -- Establecer tiempo de escalado si la categoría lo requiere
    IF EXISTS (SELECT 1 FROM ticket_categories WHERE id = NEW.category_id AND auto_escalate = true) THEN
        NEW.escalate_at := NEW.created_at + INTERVAL '24 hours';
    END IF;
    
    -- Actualizar last_activity
    NEW.last_activity := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_ticket
    BEFORE INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_ticket();

-- Función para actualizar last_activity en tickets
CREATE OR REPLACE FUNCTION update_ticket_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tickets 
    SET last_activity = NOW(), updated_at = NOW()
    WHERE id = NEW.ticket_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ticket_activity
    AFTER INSERT ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ticket_activity();

-- Función para auto-escalado de tickets
CREATE OR REPLACE FUNCTION escalate_tickets()
RETURNS INTEGER AS $$
DECLARE
    escalated_count INTEGER := 0;
    ticket_record RECORD;
    admin_id INTEGER;
BEGIN
    -- Buscar tickets que necesitan escalado
    FOR ticket_record IN
        SELECT t.id, t.assigned_to, t.created_by
        FROM tickets t
        WHERE t.escalate_at IS NOT NULL 
        AND t.escalate_at <= NOW()
        AND t.status IN ('abierto', 'en_progreso')
        AND t.escalated_to IS NULL
    LOOP
        -- Encontrar el admin asignado del usuario actual
        SELECT aa.admin_id INTO admin_id
        FROM admin_assignments aa
        WHERE aa.assigned_user_id = ticket_record.assigned_to;
        
        -- Si no tiene admin asignado, escalar al AdminPrincipal
        IF admin_id IS NULL THEN
            SELECT u.id INTO admin_id
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name = 'administrador_principal'
            LIMIT 1;
        END IF;
        
        -- Actualizar el ticket
        UPDATE tickets 
        SET escalated_to = admin_id,
            escalate_at = NOW() + INTERVAL '24 hours' -- Próximo escalado en 24h más
        WHERE id = ticket_record.id;
        
        escalated_count := escalated_count + 1;
        
        -- Crear notificación de escalado
        INSERT INTO notifications (user_id, ticket_id, type, title, message)
        VALUES (
            admin_id,
            ticket_record.id,
            'escalation',
            'Ticket escalado',
            'Se te ha escalado un ticket que requiere atención'
        );
    END LOOP;
    
    RETURN escalated_count;
END;
$$ LANGUAGE plpgsql;

-- Índices para optimización
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_block_id ON tickets(block_id);
CREATE INDEX idx_tickets_escalate_at ON tickets(escalate_at) WHERE escalate_at IS NOT NULL;
CREATE INDEX idx_tickets_last_activity ON tickets(last_activity DESC);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_sender_id ON ticket_messages(sender_id);
CREATE INDEX idx_ticket_messages_created_at ON ticket_messages(created_at DESC);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_ticket_participants_ticket_id ON ticket_participants(ticket_id);
CREATE INDEX idx_ticket_participants_user_id ON ticket_participants(user_id);

-- Vista para información completa de tickets
CREATE VIEW ticket_complete_info AS
SELECT 
    t.id,
    t.ticket_number,
    t.origin_type,
    t.title,
    t.status,
    t.priority,
    t.created_at,
    t.updated_at,
    t.last_activity,
    
    -- Información del creador
    creator.nickname as creator_nickname,
    creator.email as creator_email,
    
    -- Información del asignado
    assigned.nickname as assigned_nickname,
    assigned.email as assigned_email,
    
    -- Información del escalado
    escalated.nickname as escalated_nickname,
    
    -- Información de categoría
    tc.name as category_name,
    tc.priority as category_priority,
    
    -- Información del bloque (si aplica)
    b.name as block_name,
    b.creator_id as block_creator_id,
    block_creator.nickname as block_creator_nickname,
    
    -- Contadores
    (SELECT COUNT(*) FROM ticket_messages tm WHERE tm.ticket_id = t.id) as message_count,
    (SELECT COUNT(*) FROM ticket_attachments ta WHERE ta.ticket_id = t.id) as attachment_count,
    
    -- Último mensaje
    (SELECT tm.message_text FROM ticket_messages tm 
     WHERE tm.ticket_id = t.id 
     ORDER BY tm.created_at DESC LIMIT 1) as last_message,
    (SELECT tm.created_at FROM ticket_messages tm 
     WHERE tm.ticket_id = t.id 
     ORDER BY tm.created_at DESC LIMIT 1) as last_message_at,
    (SELECT u.nickname FROM ticket_messages tm 
     JOIN users u ON tm.sender_id = u.id
     WHERE tm.ticket_id = t.id 
     ORDER BY tm.created_at DESC LIMIT 1) as last_message_by

FROM tickets t
LEFT JOIN users creator ON t.created_by = creator.id
LEFT JOIN users assigned ON t.assigned_to = assigned.id
LEFT JOIN users escalated ON t.escalated_to = escalated.id
LEFT JOIN ticket_categories tc ON t.category_id = tc.id
LEFT JOIN blocks b ON t.block_id = b.id
LEFT JOIN users block_creator ON b.creator_id = block_creator.id;
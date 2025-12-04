-- Sistema de Roles Jerárquico No Excluyente para PLAYTEST
-- Extensión del esquema existente para soportar roles múltiples

-- Tabla de roles disponibles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    hierarchy_level INTEGER NOT NULL, -- 1=Administrador Principal, 2=Admin Secundario, 3=Profesor/Creador, 4=Usuario, 5=Servicio Técnico
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar roles predefinidos
INSERT INTO roles (name, description, hierarchy_level, permissions) VALUES
('administrador_principal', 'Acceso total, gestión de otros administradores', 1, '{"all": true}'),
('administrador_secundario', 'Acceso total pero gestiona usuarios asignados', 2, '{"manage_assigned_users": true, "view_admin_panels": true}'),
('profesor_creador', 'Creador de contenido, responsable de incidencias de sus bloques', 3, '{"create_blocks": true, "manage_own_blocks": true}'),
('jugador', 'Asignado automáticamente al cargar primer bloque ajeno', 4, '{"play_games": true, "load_blocks": true}'),
('servicio_tecnico', 'Recibe únicamente incidencias técnicas generales', 5, '{"manage_technical_issues": true}');

-- Tabla de asignación de roles (permite roles múltiples)
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id), -- Quién asignó este rol
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auto_assigned BOOLEAN DEFAULT false, -- Si fue asignado automáticamente
    UNIQUE(user_id, role_id)
);

-- Tabla de asignaciones entre administradores secundarios y usuarios
CREATE TABLE admin_assignments (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id), -- Admin Principal que hizo la asignación
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assigned_user_id) -- Un usuario solo puede estar asignado a un admin secundario
);

-- Sistema de luminarias (puntos/créditos)
CREATE TABLE user_luminarias (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    actuales INTEGER DEFAULT 0,
    ganadas INTEGER DEFAULT 0,
    gastadas INTEGER DEFAULT 0,
    abonadas INTEGER DEFAULT 0,
    compradas INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de incidencias con asignación automática
CREATE TABLE incidencias (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- 'tecnica_general', 'bloque_especifico'
    descripcion TEXT NOT NULL,
    reportado_por INTEGER REFERENCES users(id),
    asignado_a INTEGER REFERENCES users(id), -- Auto-asignado según tipo
    bloque_id INTEGER REFERENCES blocks(id), -- Solo para incidencias de bloque específico
    estado VARCHAR(20) DEFAULT 'pendiente', -- 'pendiente', 'en_proceso', 'resuelto'
    prioridad INTEGER DEFAULT 1, -- 1=baja, 2=media, 3=alta
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Extensión de la tabla blocks para estadísticas
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS total_users INTEGER DEFAULT 0;
ALTER TABLE blocks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Triggers para auto-asignación de roles

-- Función para asignar rol "profesor_creador" al crear primer bloque público
CREATE OR REPLACE FUNCTION auto_assign_profesor_creador()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el bloque es público
    IF NEW.is_public = true THEN
        -- Verificar si el usuario ya tiene el rol de profesor_creador
        IF NOT EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = NEW.creator_id AND r.name = 'profesor_creador'
        ) THEN
            -- Asignar rol de profesor_creador
            INSERT INTO user_roles (user_id, role_id, auto_assigned)
            SELECT NEW.creator_id, r.id, true
            FROM roles r
            WHERE r.name = 'profesor_creador';
        END IF;
        
        -- Inicializar luminarias si no existen
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.creator_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_profesor_creador
    AFTER INSERT ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_profesor_creador();

-- Función para asignar rol "jugador" al cargar bloque ajeno
CREATE OR REPLACE FUNCTION auto_assign_jugador_role()
RETURNS TRIGGER AS $$
DECLARE
    block_creator_id INTEGER;
BEGIN
    -- Obtener el creador del bloque
    SELECT creator_id INTO block_creator_id
    FROM blocks
    WHERE id = ANY(NEW.loaded_blocks::int[]);

    -- Solo asignar si carga un bloque que no es suyo
    IF block_creator_id != NEW.user_id THEN
        -- Verificar si el usuario ya tiene el rol de jugador
        IF NOT EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = NEW.user_id AND r.name = 'jugador'
        ) THEN
            -- Asignar rol de jugador
            INSERT INTO user_roles (user_id, role_id, auto_assigned)
            SELECT NEW.user_id, r.id, true
            FROM roles r
            WHERE r.name = 'jugador';
        END IF;
        
        -- Inicializar luminarias si no existen
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.user_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_jugador
    AFTER UPDATE OF loaded_blocks ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_jugador_role();

-- Función para verificar y asignar AdminPrincipal automáticamente
CREATE OR REPLACE FUNCTION check_admin_principal_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el nickname es exactamente "AdminPrincipal"
    IF NEW.nickname = 'AdminPrincipal' THEN
        -- Asignar rol de administrador_principal
        INSERT INTO user_roles (user_id, role_id, auto_assigned)
        SELECT NEW.id, r.id, true
        FROM roles r
        WHERE r.name = 'administrador_principal';
        
        -- Inicializar luminarias
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_admin_principal
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_admin_principal_registration();

-- Índices para optimizar consultas
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_admin_assignments_admin_id ON admin_assignments(admin_id);
CREATE INDEX idx_admin_assignments_assigned_user_id ON admin_assignments(assigned_user_id);
CREATE INDEX idx_user_luminarias_user_id ON user_luminarias(user_id);
CREATE INDEX idx_incidencias_asignado_a ON incidencias(asignado_a);
CREATE INDEX idx_incidencias_tipo ON incidencias(tipo);

-- Vista para obtener información completa de usuarios con sus roles
CREATE VIEW user_complete_info AS
SELECT 
    u.id,
    u.nickname,
    u.email,
    u.created_at,
    COALESCE(ul.actuales, 0) as luminarias_actuales,
    COALESCE(ul.ganadas, 0) as luminarias_ganadas,
    COALESCE(ul.gastadas, 0) as luminarias_gastadas,
    COALESCE(ul.abonadas, 0) as luminarias_abonadas,
    COALESCE(ul.compradas, 0) as luminarias_compradas,
    array_agg(DISTINCT r.name) as roles,
    array_agg(DISTINCT r.hierarchy_level) as role_levels,
    COUNT(DISTINCT b.id) as bloques_creados,
    COUNT(DISTINCT q.id) as preguntas_totales,
    COALESCE(array_length(up.loaded_blocks::int[], 1), 0) as bloques_cargados
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN user_luminarias ul ON u.id = ul.user_id
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN blocks b ON u.id = b.creator_id AND b.is_public = true
LEFT JOIN questions q ON b.id = q.block_id
GROUP BY u.id, u.nickname, u.email, u.created_at, ul.actuales, ul.ganadas, ul.gastadas, ul.abonadas, ul.compradas, up.loaded_blocks;
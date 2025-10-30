-- Actualización del Sistema de Roles Jerárquico No Excluyente para PLAYTEST
-- Separación de roles Profesor y Creador de Contenido

-- 1. Actualizar roles existentes
UPDATE roles SET 
    name = 'creador_contenido',
    description = 'Asignado automáticamente al crear primer bloque público, enfocado en marketing y monetización',
    hierarchy_level = 3,
    permissions = '{"create_blocks": true, "manage_own_blocks": true, "marketing": true, "monetization": true}'
WHERE name = 'profesor_creador';

-- 2. Insertar nuevo rol Profesor
INSERT INTO roles (name, description, hierarchy_level, permissions) VALUES
('profesor', 'Asignado manualmente por administradores o código educativo, enfocado en gestión académica', 3, '{"manage_students": true, "academic_reports": true, "assign_blocks": true}')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    hierarchy_level = EXCLUDED.hierarchy_level,
    permissions = EXCLUDED.permissions;

-- 3. Actualizar permisos de roles existentes
UPDATE roles SET permissions = '{"all": true, "manage_admins": true, "assign_roles": true, "redistribute_users": true}'
WHERE name = 'administrador_principal';

UPDATE roles SET permissions = '{"manage_assigned_users": true, "view_admin_panels": true, "assign_blocks": true}'
WHERE name = 'administrador_secundario';

-- 4. Crear tabla de códigos educativos para asignación de profesores
CREATE TABLE IF NOT EXISTS educational_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    institution_name VARCHAR(200),
    created_by INTEGER REFERENCES users(id),
    max_uses INTEGER DEFAULT NULL, -- NULL = ilimitado
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMP DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear tabla de asignaciones educativas
CREATE TABLE IF NOT EXISTS educational_assignments (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER REFERENCES users(id),
    student_id INTEGER REFERENCES users(id),
    educational_code_id INTEGER REFERENCES educational_codes(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(professor_id, student_id)
);

-- 6. Extender tabla user_luminarias con campos adicionales
ALTER TABLE user_luminarias ADD COLUMN IF NOT EXISTS abonadas_marketing INTEGER DEFAULT 0;
ALTER TABLE user_luminarias ADD COLUMN IF NOT EXISTS ingresos_monetizacion DECIMAL(10,2) DEFAULT 0.00;

-- 7. Actualizar función de auto-asignación para Creador de Contenido
CREATE OR REPLACE FUNCTION auto_assign_creador_contenido()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si el bloque es público
    IF NEW.is_public = true THEN
        -- Verificar si el usuario ya tiene el rol de creador_contenido
        IF NOT EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = NEW.creator_id AND r.name = 'creador_contenido'
        ) THEN
            -- Asignar rol de creador_contenido
            INSERT INTO user_roles (user_id, role_id, auto_assigned)
            SELECT NEW.creator_id, r.id, true
            FROM roles r
            WHERE r.name = 'creador_contenido';
        END IF;
        
        -- Inicializar luminarias si no existen
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.creator_id)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Actualizar triggers existentes
DROP TRIGGER IF EXISTS trigger_auto_assign_profesor_creador ON blocks;
CREATE TRIGGER trigger_auto_assign_creador_contenido
    AFTER INSERT ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_creador_contenido();

-- 9. Función para verificación automática de AdminPrincipal
CREATE OR REPLACE FUNCTION check_admin_principal_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el nickname es exactamente "AdminPrincipal"
    IF NEW.nickname = 'AdminPrincipal' THEN
        -- Verificar contraseña por defecto "kikejfer"
        IF NEW.password_hash != crypt('kikejfer', gen_salt('bf')) THEN
            RAISE EXCEPTION 'AdminPrincipal debe usar la contraseña por defecto inicial';
        END IF;
        
        -- Asignar rol de administrador_principal
        INSERT INTO user_roles (user_id, role_id, auto_assigned)
        SELECT NEW.id, r.id, true
        FROM roles r
        WHERE r.name = 'administrador_principal';
        
        -- Inicializar luminarias
        INSERT INTO user_luminarias (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;
        
        -- Marcar que debe cambiar contraseña
        INSERT INTO user_profiles (user_id, preferences)
        VALUES (NEW.id, '{"must_change_password": true}')
        ON CONFLICT (user_id) DO UPDATE SET
            preferences = user_profiles.preferences || '{"must_change_password": true}';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Función de redistribución automática de usuarios
CREATE OR REPLACE FUNCTION redistribute_users_to_admins()
RETURNS INTEGER AS $$
DECLARE
    admin_count INTEGER;
    user_count INTEGER;
    users_per_admin INTEGER;
    remaining_users INTEGER;
    admin_record RECORD;
    user_record RECORD;
    current_admin_users INTEGER;
    assignment_counter INTEGER := 0;
BEGIN
    -- Contar administradores secundarios activos
    SELECT COUNT(*) INTO admin_count
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'administrador_secundario';
    
    -- Si no hay administradores secundarios, salir
    IF admin_count = 0 THEN
        RETURN 0;
    END IF;
    
    -- Limpiar asignaciones existentes
    DELETE FROM admin_assignments;
    
    -- Contar usuarios (profesores/creadores + usuarios normales)
    SELECT COUNT(DISTINCT ur.user_id) INTO user_count
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name IN ('creador_contenido', 'profesor', 'usuario');
    
    -- Calcular distribución
    users_per_admin := user_count / admin_count;
    remaining_users := user_count % admin_count;
    
    -- Redistribuir usuarios
    assignment_counter := 0;
    
    FOR admin_record IN
        SELECT DISTINCT ur.user_id as admin_id
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE r.name = 'administrador_secundario'
        ORDER BY ur.assigned_at
    LOOP
        current_admin_users := users_per_admin;
        
        -- Agregar un usuario extra a los primeros admins si hay remainder
        IF remaining_users > 0 THEN
            current_admin_users := current_admin_users + 1;
            remaining_users := remaining_users - 1;
        END IF;
        
        -- Asignar usuarios a este admin
        FOR user_record IN
            SELECT DISTINCT ur.user_id
            FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE r.name IN ('creador_contenido', 'profesor', 'usuario')
            AND NOT EXISTS (
                SELECT 1 FROM admin_assignments aa WHERE aa.assigned_user_id = ur.user_id
            )
            ORDER BY ur.assigned_at
            LIMIT current_admin_users
        LOOP
            INSERT INTO admin_assignments (admin_id, assigned_user_id, assigned_by)
            VALUES (admin_record.admin_id, user_record.user_id, 
                   (SELECT ur.user_id FROM user_roles ur 
                    JOIN roles r ON ur.role_id = r.id 
                    WHERE r.name = 'administrador_principal' LIMIT 1));
            
            assignment_counter := assignment_counter + 1;
        END LOOP;
    END LOOP;
    
    RETURN assignment_counter;
END;
$$ LANGUAGE plpgsql;

-- 11. Trigger para redistribución automática cuando se crea un nuevo admin secundario
CREATE OR REPLACE FUNCTION trigger_redistribute_on_new_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si se asigna rol de administrador_secundario
    IF EXISTS (
        SELECT 1 FROM roles r 
        WHERE r.id = NEW.role_id AND r.name = 'administrador_secundario'
    ) THEN
        -- Ejecutar redistribución automática
        PERFORM redistribute_users_to_admins();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_redistribute_on_new_admin
    AFTER INSERT ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_redistribute_on_new_admin();

-- 12. Vista completa para panel de Administrador Principal
CREATE OR REPLACE VIEW admin_principal_dashboard AS
WITH admin_stats AS (
    SELECT 
        u.id,
        u.nickname,
        u.email,
        up.first_name,
        up.last_name,
        COALESCE(COUNT(DISTINCT aa.assigned_user_id), 0) as assigned_users_count,
        COALESCE(SUM(creator_blocks.block_count), 0) as total_blocks_assigned,
        COALESCE(SUM(creator_blocks.question_count), 0) as total_questions_assigned,
        COALESCE(ul.actuales, 0) as luminarias
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_luminarias ul ON u.id = ul.user_id
    LEFT JOIN admin_assignments aa ON u.id = aa.admin_id
    LEFT JOIN (
        SELECT 
            b.creator_id,
            COUNT(b.id) as block_count,
            COALESCE(SUM(b.total_questions), 0) as question_count
        FROM blocks b
        WHERE b.is_public = true
        GROUP BY b.creator_id
    ) creator_blocks ON aa.assigned_user_id = creator_blocks.creator_id
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'administrador_secundario'
    GROUP BY u.id, u.nickname, u.email, up.first_name, up.last_name, ul.actuales
),
creator_stats AS (
    SELECT 
        u.id,
        u.nickname,
        u.email,
        up.first_name,
        up.last_name,
        COALESCE(aa.admin_id, 0) as assigned_admin_id,
        COALESCE(admin_user.nickname, 'Sin asignar') as assigned_admin_nickname,
        COUNT(DISTINCT b.id) as blocks_created,
        COALESCE(SUM(b.total_questions), 0) as total_questions,
        COALESCE(SUM(b.total_users), 0) as total_users_blocks,
        COALESCE(ul.actuales, 0) as luminarias_actuales,
        COALESCE(ul.ganadas, 0) as luminarias_ganadas,
        COALESCE(ul.gastadas, 0) as luminarias_gastadas,
        COALESCE(ul.abonadas, 0) as luminarias_abonadas,
        COALESCE(ul.compradas, 0) as luminarias_compradas
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_luminarias ul ON u.id = ul.user_id
    LEFT JOIN admin_assignments aa ON u.id = aa.assigned_user_id
    LEFT JOIN users admin_user ON aa.admin_id = admin_user.id
    LEFT JOIN blocks b ON u.id = b.creator_id AND b.is_public = true
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name IN ('creador_contenido', 'profesor')
    GROUP BY u.id, u.nickname, u.email, up.first_name, up.last_name, 
             aa.admin_id, admin_user.nickname, ul.actuales, ul.ganadas, 
             ul.gastadas, ul.abonadas, ul.compradas
),
user_stats AS (
    SELECT 
        u.id,
        u.nickname,
        u.email,
        up.first_name,
        up.last_name,
        COALESCE(aa.admin_id, 0) as assigned_admin_id,
        COALESCE(admin_user.nickname, 'Sin asignar') as assigned_admin_nickname,
        COALESCE(array_length(up.loaded_blocks::int[], 1), 0) as blocks_loaded,
        COALESCE(ul.actuales, 0) as luminarias_actuales,
        COALESCE(ul.ganadas, 0) as luminarias_ganadas,
        COALESCE(ul.gastadas, 0) as luminarias_gastadas,
        COALESCE(ul.abonadas, 0) as luminarias_abonadas,
        COALESCE(ul.compradas, 0) as luminarias_compradas
    FROM users u
    LEFT JOIN user_profiles up ON u.id = up.user_id
    LEFT JOIN user_luminarias ul ON u.id = ul.user_id
    LEFT JOIN admin_assignments aa ON u.id = aa.assigned_user_id
    LEFT JOIN users admin_user ON aa.admin_id = admin_user.id
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'usuario'
    GROUP BY u.id, u.nickname, u.email, up.first_name, up.last_name, 
             aa.admin_id, admin_user.nickname, up.loaded_blocks,
             ul.actuales, ul.ganadas, ul.gastadas, ul.abonadas, ul.compradas
)
SELECT 'admin_secundario' as user_type, * FROM admin_stats
UNION ALL
SELECT 'creador_profesor' as user_type, id, nickname, email, first_name, last_name, 
       assigned_admin_id as admin_id, assigned_admin_nickname, blocks_created as metric1,
       total_questions as metric2, total_users_blocks as metric3, luminarias_actuales,
       luminarias_ganadas, luminarias_gastadas, luminarias_abonadas, luminarias_compradas
FROM creator_stats
UNION ALL
SELECT 'usuario' as user_type, id, nickname, email, first_name, last_name,
       assigned_admin_id as admin_id, assigned_admin_nickname, blocks_loaded as metric1,
       0 as metric2, 0 as metric3, luminarias_actuales, luminarias_ganadas,
       luminarias_gastadas, luminarias_abonadas, luminarias_compradas
FROM user_stats;

-- 13. Índices adicionales para optimización
CREATE INDEX IF NOT EXISTS idx_educational_codes_code ON educational_codes(code);
CREATE INDEX IF NOT EXISTS idx_educational_assignments_professor ON educational_assignments(professor_id);
CREATE INDEX IF NOT EXISTS idx_educational_assignments_student ON educational_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_blocks_creator_public ON blocks(creator_id, is_public);
CREATE INDEX IF NOT EXISTS idx_user_roles_multiple ON user_roles(user_id, role_id);

-- 14. Función para asignación de profesor mediante código educativo
CREATE OR REPLACE FUNCTION assign_professor_by_code(
    p_user_id INTEGER,
    p_educational_code VARCHAR(20)
)
RETURNS BOOLEAN AS $$
DECLARE
    code_record RECORD;
    professor_id INTEGER;
BEGIN
    -- Verificar que el código existe y está activo
    SELECT * INTO code_record
    FROM educational_codes 
    WHERE code = p_educational_code 
    AND is_active = true 
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Obtener el profesor creador del código
    professor_id := code_record.created_by;
    
    -- Asignar rol de profesor al creador del código si no lo tiene
    INSERT INTO user_roles (user_id, role_id, auto_assigned)
    SELECT professor_id, r.id, false
    FROM roles r
    WHERE r.name = 'profesor'
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Crear asignación educativa
    INSERT INTO educational_assignments (professor_id, student_id, educational_code_id)
    VALUES (professor_id, p_user_id, code_record.id)
    ON CONFLICT (professor_id, student_id) DO NOTHING;
    
    -- Incrementar uso del código
    UPDATE educational_codes 
    SET current_uses = current_uses + 1
    WHERE id = code_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
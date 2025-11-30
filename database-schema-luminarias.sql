-- Sistema de Luminarias Dual para PLAYTEST
-- Moneda virtual diferenciada para usuarios y profesores/creadores

-- 1. Tabla de configuración de valores de Luminarias
CREATE TABLE IF NOT EXISTS luminarias_config (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL, -- 'user_earning', 'user_spending', 'creator_earning', 'creator_spending'
    subcategory VARCHAR(50) NOT NULL, -- 'study_activity', 'competition', 'engagement', etc.
    action_type VARCHAR(100) NOT NULL, -- 'complete_session', 'win_duel', 'daily_login', etc.
    min_amount INTEGER NOT NULL DEFAULT 0,
    max_amount INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, subcategory, action_type)
);

-- 2. Tabla principal de balance de usuarios
CREATE TABLE IF NOT EXISTS user_luminarias (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    current_balance INTEGER DEFAULT 200, -- Balance inicial de 200 Luminarias
    total_earned INTEGER DEFAULT 200, -- Total ganado (incluyendo inicial)
    total_spent INTEGER DEFAULT 0, -- Total gastado
    lifetime_earnings INTEGER DEFAULT 200, -- Ganancias de toda la vida
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- 3. Historial detallado de transacciones
CREATE TABLE IF NOT EXISTS luminarias_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'earn', 'spend', 'transfer_in', 'transfer_out', 'conversion'
    amount INTEGER NOT NULL, -- Positivo para ganancias, negativo para gastos
    balance_before INTEGER NOT NULL, -- Balance antes de la transacción
    balance_after INTEGER NOT NULL, -- Balance después de la transacción
    
    -- Categorización por rol
    user_role VARCHAR(20) NOT NULL, -- 'user', 'creator'
    category VARCHAR(50) NOT NULL, -- Categoría principal del movimiento
    subcategory VARCHAR(50), -- Subcategoría específica
    action_type VARCHAR(100) NOT NULL, -- Acción específica que generó el movimiento
    
    -- Detalles de la transacción
    description TEXT NOT NULL, -- Descripción legible
    reference_id INTEGER, -- ID de referencia (bloque, duelo, etc.)
    reference_type VARCHAR(50), -- Tipo de referencia ('block', 'duel', 'purchase', etc.)
    
    -- Metadatos
    metadata JSONB DEFAULT '{}', -- Información adicional flexible
    
    -- Transferencias entre usuarios
    from_user_id INTEGER REFERENCES users(id), -- Solo para transferencias
    to_user_id INTEGER REFERENCES users(id), -- Solo para transferencias
    
    -- Control de validación
    is_validated BOOLEAN DEFAULT true, -- Para validar transacciones antes de aplicar
    validated_by INTEGER REFERENCES users(id), -- Quién validó (para conversiones)
    validated_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de productos en la tienda virtual
CREATE TABLE IF NOT EXISTS luminarias_store_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'personalization', 'game_features', 'premium_services', 'tools', 'marketing'
    subcategory VARCHAR(50), -- 'avatars', 'themes', 'effects', 'hints', 'analytics', etc.
    
    -- Segmentación por rol
    target_role VARCHAR(20) NOT NULL, -- 'user', 'creator', 'both'
    
    -- Precios
    price_luminarias INTEGER NOT NULL,
    price_real_money DECIMAL(10,2), -- Precio alternativo en dinero real (opcional)
    
    -- Configuración del item
    item_type VARCHAR(50) NOT NULL, -- 'consumable', 'permanent', 'subscription', 'service'
    duration_days INTEGER, -- Para subscripciones/servicios temporales
    max_uses INTEGER, -- Para items consumibles (NULL = ilimitado)
    
    -- Disponibilidad
    is_active BOOLEAN DEFAULT true,
    requires_level INTEGER DEFAULT 1, -- Nivel mínimo requerido
    limited_quantity INTEGER, -- Cantidad limitada (NULL = ilimitado)
    stock_remaining INTEGER, -- Stock actual
    
    -- Metadatos del producto
    metadata JSONB DEFAULT '{}', -- Configuración específica del item
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de compras realizadas por usuarios
CREATE TABLE IF NOT EXISTS luminarias_purchases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    store_item_id INTEGER REFERENCES luminarias_store_items(id) NOT NULL,
    transaction_id INTEGER REFERENCES luminarias_transactions(id) NOT NULL,
    
    -- Detalles de la compra
    quantity INTEGER DEFAULT 1,
    unit_price INTEGER NOT NULL, -- Precio por unidad en Luminarias
    total_price INTEGER NOT NULL, -- Precio total pagado
    
    -- Estado del item comprado
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'expired', 'consumed', 'refunded'
    expires_at TIMESTAMP, -- Para items temporales
    uses_remaining INTEGER, -- Para items consumibles
    
    -- Metadatos
    purchase_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabla de marketplace - servicios entre usuarios
CREATE TABLE IF NOT EXISTS luminarias_marketplace (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- Quien ofrece el servicio
    service_name VARCHAR(200) NOT NULL,
    service_description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'tutoring', 'content_creation', 'coaching', 'consultation'
    
    -- Precios y configuración
    price_luminarias INTEGER NOT NULL,
    price_real_money DECIMAL(10,2), -- Precio alternativo
    service_type VARCHAR(30) NOT NULL, -- 'one_time', 'hourly', 'package', 'subscription'
    duration_minutes INTEGER, -- Para servicios por tiempo
    
    -- Disponibilidad
    is_active BOOLEAN DEFAULT true,
    max_clients INTEGER, -- Máximo de clientes simultáneos
    current_clients INTEGER DEFAULT 0,
    
    -- Metadatos del servicio
    requirements TEXT, -- Requisitos o condiciones
    delivery_method VARCHAR(50), -- 'video_call', 'chat', 'email', 'content_delivery'
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de contrataciones en marketplace
CREATE TABLE IF NOT EXISTS luminarias_marketplace_bookings (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES luminarias_marketplace(id) NOT NULL,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    provider_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    transaction_id INTEGER REFERENCES luminarias_transactions(id) NOT NULL,
    
    -- Detalles de la contratación
    total_price INTEGER NOT NULL, -- Precio pagado en Luminarias
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded'
    
    -- Programación
    scheduled_at TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Comunicación y entrega
    delivery_method VARCHAR(50),
    meeting_link TEXT,
    delivery_notes TEXT,
    
    -- Calificaciones
    client_rating INTEGER, -- 1-5 estrellas
    provider_rating INTEGER, -- 1-5 estrellas
    client_review TEXT,
    provider_review TEXT,
    
    -- Fechas importantes
    confirmed_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de conversiones a dinero real
CREATE TABLE IF NOT EXISTS luminarias_conversions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    transaction_id INTEGER REFERENCES luminarias_transactions(id) NOT NULL,
    
    -- Detalles de la conversión
    luminarias_amount INTEGER NOT NULL, -- Luminarias convertidas
    conversion_rate DECIMAL(10,6) NOT NULL, -- Tasa de conversión (€ por Luminaria)
    gross_amount DECIMAL(10,2) NOT NULL, -- Cantidad bruta en euros
    commission_rate DECIMAL(5,4) DEFAULT 0.20, -- Comisión (20% por defecto)
    commission_amount DECIMAL(10,2) NOT NULL, -- Comisión cobrada en euros
    net_amount DECIMAL(10,2) NOT NULL, -- Cantidad neta a recibir en euros
    
    -- Estado de la conversión
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'approved', 'processing', 'completed', 'rejected'
    
    -- Información de pago
    payment_method VARCHAR(50), -- 'paypal', 'bank_transfer', 'stripe', etc.
    payment_details JSONB DEFAULT '{}', -- Detalles del método de pago
    
    -- Control administrativo
    reviewed_by INTEGER REFERENCES users(id), -- Admin que revisó
    review_notes TEXT,
    approved_at TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    rejected_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Insertar configuración inicial de valores de Luminarias

-- USUARIOS - GANANCIAS
INSERT INTO luminarias_config (category, subcategory, action_type, min_amount, max_amount, description) VALUES
-- Actividad de estudio
('user_earning', 'study_activity', 'complete_session', 8, 25, 'Completar una sesión de estudio'),
('user_earning', 'study_activity', 'complete_block', 40, 80, 'Completar un bloque completo'),
('user_earning', 'study_activity', 'level_up', 60, 120, 'Subir de nivel en el sistema'),
('user_earning', 'study_activity', 'streak_bonus', 10, 30, 'Bonus por racha de días consecutivos'),

-- Competición
('user_earning', 'competition', 'participate_duel', 15, 25, 'Participar en un duelo'),
('user_earning', 'competition', 'win_duel', 30, 60, 'Ganar un duelo'),
('user_earning', 'competition', 'weekly_challenge', 50, 100, 'Completar reto semanal'),
('user_earning', 'competition', 'tournament_prize', 100, 500, 'Premio en torneo'),

-- Engagement
('user_earning', 'engagement', 'daily_login', 5, 15, 'Login diario'),
('user_earning', 'engagement', 'rate_block', 10, 20, 'Valorar un bloque'),
('user_earning', 'engagement', 'report_issue', 20, 40, 'Reportar problema o error'),
('user_earning', 'engagement', 'feedback', 15, 30, 'Proporcionar feedback valioso'),

-- Bonificaciones
('user_earning', 'bonuses', 'registration', 200, 200, 'Bonus de registro inicial'),
('user_earning', 'bonuses', 'achievement', 100, 300, 'Logro especial desbloqueado'),
('user_earning', 'bonuses', 'referral', 150, 250, 'Referir nuevo usuario'),
('user_earning', 'bonuses', 'monthly_active', 200, 400, 'Bonus por ser usuario activo del mes');

-- USUARIOS - GASTOS
INSERT INTO luminarias_config (category, subcategory, action_type, min_amount, max_amount, description) VALUES
-- Personalización
('user_spending', 'personalization', 'avatar', 50, 120, 'Comprar avatar personalizado'),
('user_spending', 'personalization', 'theme', 80, 150, 'Comprar tema visual'),
('user_spending', 'personalization', 'effects', 30, 100, 'Efectos especiales y animaciones'),
('user_spending', 'personalization', 'badge', 60, 200, 'Insignias y logros personalizados'),

-- Funcionalidades de juego
('user_spending', 'game_features', 'revive', 15, 30, 'Revivir en juego'),
('user_spending', 'game_features', 'hint', 20, 50, 'Comprar pista'),
('user_spending', 'game_features', 'multiplier', 40, 100, 'Multiplicador de puntos'),
('user_spending', 'game_features', 'extra_life', 25, 75, 'Vida extra en competición'),

-- Servicios premium
('user_spending', 'premium_services', 'tutoring_hour', 800, 1500, 'Hora de tutoría personalizada'),
('user_spending', 'premium_services', 'exclusive_content', 300, 800, 'Acceso a contenido exclusivo'),
('user_spending', 'premium_services', 'priority_support', 200, 500, 'Soporte prioritario'),
('user_spending', 'premium_services', 'analytics', 400, 1000, 'Analytics personales detallados');

-- PROFESORES/CREADORES - GANANCIAS
INSERT INTO luminarias_config (category, subcategory, action_type, min_amount, max_amount, description) VALUES
-- Ingresos automáticos
('creator_earning', 'automatic_income', 'weekly_basic', 60, 120, 'Ingreso semanal básico'),
('creator_earning', 'automatic_income', 'weekly_advanced', 150, 270, 'Ingreso semanal avanzado'),
('creator_earning', 'automatic_income', 'active_users_bonus', 20, 100, 'Bonus por usuarios activos'),

-- Creación de contenido
('creator_earning', 'content_creation', 'small_block', 150, 300, 'Crear bloque pequeño (1-20 preguntas)'),
('creator_earning', 'content_creation', 'medium_block', 350, 500, 'Crear bloque mediano (21-50 preguntas)'),
('creator_earning', 'content_creation', 'large_block', 600, 750, 'Crear bloque grande (51+ preguntas)'),
('creator_earning', 'content_creation', 'popular_bonus', 100, 400, 'Bonus por popularidad del bloque'),

-- Calidad y engagement
('creator_earning', 'quality_engagement', 'high_rating', 50, 150, 'Bloque con alta calificación'),
('creator_earning', 'quality_engagement', 'review_bonus', 25, 75, 'Bonus por reseñas positivas'),
('creator_earning', 'quality_engagement', 'recognition_award', 200, 500, 'Premio por reconocimiento'),
('creator_earning', 'quality_engagement', 'featured_content', 150, 300, 'Contenido destacado');

-- PROFESORES/CREADORES - GASTOS
INSERT INTO luminarias_config (category, subcategory, action_type, min_amount, max_amount, description) VALUES
-- Herramientas de creación
('creator_spending', 'creation_tools', 'ai_assistant', 200, 350, 'Asistente IA para creación'),
('creator_spending', 'creation_tools', 'analytics_pro', 150, 250, 'Analytics profesionales'),
('creator_spending', 'creation_tools', 'templates_pack', 180, 300, 'Paquete de plantillas premium'),
('creator_spending', 'creation_tools', 'batch_import', 300, 400, 'Importación masiva de contenido'),

-- Marketing y promoción
('creator_spending', 'marketing', 'feature_block', 250, 400, 'Destacar bloque en portada'),
('creator_spending', 'marketing', 'newsletter_feature', 300, 500, 'Aparecer en newsletter'),
('creator_spending', 'marketing', 'badge_promotion', 200, 350, 'Insignia promocional'),
('creator_spending', 'marketing', 'boost_visibility', 400, 600, 'Impulsar visibilidad'),

-- Servicios premium
('creator_spending', 'premium_services', 'priority_support', 200, 400, 'Soporte técnico prioritario'),
('creator_spending', 'premium_services', 'consultation', 300, 600, 'Consultoría personalizada'),
('creator_spending', 'premium_services', 'training', 400, 800, 'Formación especializada');

-- 10. Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_user_luminarias_user_id ON user_luminarias(user_id);
CREATE INDEX IF NOT EXISTS idx_luminarias_transactions_user_id ON luminarias_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_luminarias_transactions_type ON luminarias_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_luminarias_transactions_role ON luminarias_transactions(user_role);
CREATE INDEX IF NOT EXISTS idx_luminarias_transactions_category ON luminarias_transactions(category);
CREATE INDEX IF NOT EXISTS idx_luminarias_transactions_date ON luminarias_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_luminarias_store_items_role ON luminarias_store_items(target_role);
CREATE INDEX IF NOT EXISTS idx_luminarias_store_items_category ON luminarias_store_items(category);
CREATE INDEX IF NOT EXISTS idx_luminarias_store_items_active ON luminarias_store_items(is_active);
CREATE INDEX IF NOT EXISTS idx_luminarias_purchases_user_id ON luminarias_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_luminarias_marketplace_provider ON luminarias_marketplace(provider_id);
CREATE INDEX IF NOT EXISTS idx_luminarias_marketplace_active ON luminarias_marketplace(is_active);
CREATE INDEX IF NOT EXISTS idx_luminarias_marketplace_bookings_client ON luminarias_marketplace_bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_luminarias_marketplace_bookings_provider ON luminarias_marketplace_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_luminarias_conversions_user_id ON luminarias_conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_luminarias_conversions_status ON luminarias_conversions(status);

-- 11. Funciones útiles para el sistema

-- Función para obtener balance actual de un usuario
CREATE OR REPLACE FUNCTION get_user_luminarias_balance(p_user_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_current_balance INTEGER;
BEGIN
    SELECT COALESCE(ul.current_balance, 0) INTO v_current_balance
    FROM user_luminarias ul
    WHERE ul.user_id = p_user_id;

    IF v_current_balance IS NULL THEN
        -- Crear registro inicial si no existe
        INSERT INTO user_luminarias (user_id, current_balance, total_earned, lifetime_earnings)
        VALUES (p_user_id, 200, 200, 200);
        RETURN 200;
    END IF;

    RETURN v_current_balance;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar transacción de Luminarias
CREATE OR REPLACE FUNCTION process_luminarias_transaction(
    p_user_id INTEGER,
    p_transaction_type VARCHAR(20),
    p_amount INTEGER,
    p_user_role VARCHAR(20),
    p_category VARCHAR(50),
    p_subcategory VARCHAR(50),
    p_action_type VARCHAR(100),
    p_description TEXT,
    p_reference_id INTEGER DEFAULT NULL,
    p_reference_type VARCHAR(50) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS INTEGER AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_transaction_id INTEGER;
BEGIN
    -- Obtener balance actual
    v_current_balance := get_user_luminarias_balance(p_user_id);

    -- Validar que hay suficiente saldo para gastos
    IF p_transaction_type IN ('spend', 'transfer_out') AND v_current_balance < ABS(p_amount) THEN
        RAISE EXCEPTION 'Saldo insuficiente. Balance actual: %, Cantidad requerida: %', v_current_balance, ABS(p_amount);
    END IF;

    -- Calcular nuevo balance
    IF p_transaction_type IN ('earn', 'transfer_in') THEN
        v_new_balance := v_current_balance + ABS(p_amount);
    ELSE -- spend, transfer_out, conversion
        v_new_balance := v_current_balance - ABS(p_amount);
        p_amount := -ABS(p_amount); -- Asegurar que gastos sean negativos
    END IF;

    -- Insertar transacción
    INSERT INTO luminarias_transactions (
        user_id, transaction_type, amount, balance_before, balance_after,
        user_role, category, subcategory, action_type, description,
        reference_id, reference_type, metadata
    ) VALUES (
        p_user_id, p_transaction_type, p_amount, v_current_balance, v_new_balance,
        p_user_role, p_category, p_subcategory, p_action_type, p_description,
        p_reference_id, p_reference_type, p_metadata
    ) RETURNING id INTO v_transaction_id;

    -- Actualizar balance del usuario
    INSERT INTO user_luminarias (user_id, current_balance, total_earned, total_spent, lifetime_earnings)
    VALUES (
        p_user_id,
        v_new_balance,
        CASE WHEN p_amount > 0 THEN ABS(p_amount) ELSE 0 END,
        CASE WHEN p_amount < 0 THEN ABS(p_amount) ELSE 0 END,
        CASE WHEN p_amount > 0 THEN ABS(p_amount) ELSE 0 END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_balance = v_new_balance,
        total_earned = user_luminarias.total_earned + CASE WHEN p_amount > 0 THEN ABS(p_amount) ELSE 0 END,
        total_spent = user_luminarias.total_spent + CASE WHEN p_amount < 0 THEN ABS(p_amount) ELSE 0 END,
        lifetime_earnings = user_luminarias.lifetime_earnings + CASE WHEN p_amount > 0 THEN ABS(p_amount) ELSE 0 END,
        last_activity = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;

    RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener estadísticas de Luminarias de un usuario
CREATE OR REPLACE FUNCTION get_user_luminarias_stats(p_user_id INTEGER)
RETURNS TABLE (
    current_balance INTEGER,
    total_earned INTEGER,
    total_spent INTEGER,
    lifetime_earnings INTEGER,
    transactions_count BIGINT,
    last_activity TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ul.current_balance,
        ul.total_earned,
        ul.total_spent,
        ul.lifetime_earnings,
        COALESCE(t.transaction_count, 0) as transactions_count,
        ul.last_activity
    FROM user_luminarias ul
    LEFT JOIN (
        SELECT lt.user_id, COUNT(*) as transaction_count
        FROM luminarias_transactions lt
        WHERE lt.user_id = p_user_id
        GROUP BY lt.user_id
    ) t ON ul.user_id = t.user_id
    WHERE ul.user_id = p_user_id;

    -- Si no existe registro, crear uno inicial
    IF NOT FOUND THEN
        INSERT INTO user_luminarias (user_id) VALUES (p_user_id);
        RETURN QUERY
        SELECT 200, 200, 0, 200, 0::BIGINT, CURRENT_TIMESTAMP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Poblar la tienda inicial con items básicos
INSERT INTO luminarias_store_items (name, description, category, subcategory, target_role, price_luminarias, item_type, metadata) VALUES
-- Items para usuarios
('Avatar Clásico', 'Avatar personalizado con temas clásicos', 'personalization', 'avatars', 'user', 50, 'permanent', '{"style": "classic"}'),
('Avatar Premium', 'Avatar exclusivo con animaciones', 'personalization', 'avatars', 'user', 120, 'permanent', '{"style": "premium", "animated": true}'),
('Tema Oscuro', 'Tema visual oscuro para la interfaz', 'personalization', 'themes', 'user', 80, 'permanent', '{"theme": "dark"}'),
('Tema Colorido', 'Tema con colores vibrantes', 'personalization', 'themes', 'user', 100, 'permanent', '{"theme": "colorful"}'),
('Efectos de Partículas', 'Efectos visuales al responder correctamente', 'personalization', 'effects', 'user', 60, 'permanent', '{"effect": "particles"}'),
('Pista Simple', 'Una pista para la pregunta actual', 'game_features', 'hints', 'user', 20, 'consumable', '{"max_uses": 1}'),
('Paquete de Pistas', 'Paquete de 5 pistas', 'game_features', 'hints', 'user', 80, 'consumable', '{"max_uses": 5}'),
('Revivir', 'Continuar después de una respuesta incorrecta', 'game_features', 'revival', 'user', 25, 'consumable', '{"max_uses": 1}'),
('Multiplicador x2', 'Duplica los puntos por 10 minutos', 'game_features', 'multipliers', 'user', 40, 'consumable', '{"duration": 10, "multiplier": 2}'),
('Tutoría Express', 'Sesión de tutoría de 30 minutos', 'premium_services', 'tutoring', 'user', 800, 'service', '{"duration": 30}'),
('Análisis Personal', 'Reporte detallado de tu progreso', 'premium_services', 'analytics', 'user', 400, 'service', '{"type": "personal_report"}'),

-- Items para creadores
('IA Asistente Básico', 'Ayuda IA para crear preguntas', 'creation_tools', 'ai_tools', 'creator', 200, 'consumable', '{"uses": 10}'),
('IA Asistente Pro', 'IA avanzada con plantillas', 'creation_tools', 'ai_tools', 'creator', 350, 'consumable', '{"uses": 25, "advanced": true}'),
('Analytics Pro', 'Estadísticas detalladas de tus bloques', 'creation_tools', 'analytics', 'creator', 250, 'subscription', '{"duration_days": 30}'),
('Plantillas Premium', 'Paquete de plantillas profesionales', 'creation_tools', 'templates', 'creator', 300, 'permanent', '{"template_count": 20}'),
('Destacar Bloque', 'Tu bloque aparece en la portada por 7 días', 'marketing', 'promotion', 'creator', 400, 'service', '{"duration_days": 7}'),
('Newsletter Feature', 'Aparecer en el newsletter semanal', 'marketing', 'newsletter', 'creator', 500, 'service', '{"newsletter_count": 1}'),
('Soporte Prioritario', 'Acceso a soporte técnico prioritario', 'premium_services', 'support', 'creator', 300, 'subscription', '{"duration_days": 30}'),
('Consultoría', 'Sesión de consultoría personalizada de 1 hora', 'premium_services', 'consultation', 'creator', 600, 'service', '{"duration": 60}');

-- Crear triggers para mantener actualizados los timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_luminarias_config_updated_at
    BEFORE UPDATE ON luminarias_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_luminarias_updated_at
    BEFORE UPDATE ON user_luminarias
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_luminarias_store_items_updated_at
    BEFORE UPDATE ON luminarias_store_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_luminarias_purchases_updated_at
    BEFORE UPDATE ON luminarias_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_luminarias_marketplace_updated_at
    BEFORE UPDATE ON luminarias_marketplace
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_luminarias_marketplace_bookings_updated_at
    BEFORE UPDATE ON luminarias_marketplace_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_luminarias_conversions_updated_at
    BEFORE UPDATE ON luminarias_conversions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
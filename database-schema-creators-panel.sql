-- ==========================================
-- ESQUEMA DE BASE DE DATOS - PANEL DE CREADORES
-- Sistema completo de marketing y monetización
-- ==========================================

-- TABLA: Métricas de competencia y market analytics
CREATE TABLE IF NOT EXISTS creator_market_analytics (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date_recorded DATE DEFAULT CURRENT_DATE,
    
    -- Métricas de posicionamiento
    market_rank INTEGER,
    category_rank INTEGER,
    market_share_percentage DECIMAL(5,2),
    competitor_count INTEGER,
    
    -- Métricas financieras y ROI
    revenue_current_month DECIMAL(12,2) DEFAULT 0,
    revenue_last_month DECIMAL(12,2) DEFAULT 0,
    marketing_spend DECIMAL(10,2) DEFAULT 0,
    roi_percentage DECIMAL(5,2),
    cpa_cost DECIMAL(8,2),
    ltv_average DECIMAL(10,2),
    
    -- Análisis de audiencia
    active_users_count INTEGER DEFAULT 0,
    new_users_count INTEGER DEFAULT 0,
    retention_rate DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    satisfaction_rating DECIMAL(3,2),
    
    -- Métricas de contenido
    total_blocks INTEGER DEFAULT 0,
    total_questions INTEGER DEFAULT 0,
    avg_block_rating DECIMAL(3,2),
    total_plays INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Análisis de competidores
CREATE TABLE IF NOT EXISTS competitor_analysis (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    competitor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Métricas comparativas
    competitor_rank INTEGER,
    blocks_count INTEGER,
    avg_rating DECIMAL(3,2),
    estimated_revenue DECIMAL(10,2),
    user_count INTEGER,
    
    -- Análisis de estrategias
    pricing_strategy TEXT,
    promotion_frequency INTEGER,
    content_velocity DECIMAL(5,2),
    engagement_tactics JSONB,
    
    last_analyzed TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Campañas de marketing
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    campaign_type VARCHAR(50), -- 'discount', 'bundle', 'flash_sale', 'loyalty', 'featured'
    
    -- Configuración de campaña
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    target_audience JSONB, -- Criterios de segmentación
    budget DECIMAL(10,2),
    
    -- Configuración de ofertas
    discount_percentage DECIMAL(5,2),
    discount_amount DECIMAL(8,2),
    bundle_blocks INTEGER[],
    coupon_code VARCHAR(50),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    
    -- Métricas de rendimiento
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    
    -- Estado y configuración
    is_active BOOLEAN DEFAULT true,
    auto_optimize BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Torneos y eventos de marketing
CREATE TABLE IF NOT EXISTS marketing_tournaments (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50), -- 'acquisition', 'viral', 'seasonal', 'themed'
    
    -- Configuración del torneo
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    
    -- Configuración de premios
    prize_structure JSONB, -- Estructura de premios por posición
    sponsor_info JSONB, -- Información de sponsors
    total_prize_value DECIMAL(10,2),
    
    -- Mecánicas virales
    sharing_bonus INTEGER DEFAULT 0,
    referral_bonus INTEGER DEFAULT 0,
    viral_multiplier DECIMAL(3,2) DEFAULT 1.0,
    
    -- Métricas de conversión
    registrations INTEGER DEFAULT 0,
    active_participants INTEGER DEFAULT 0,
    social_shares INTEGER DEFAULT 0,
    new_users_acquired INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'planning', -- 'planning', 'active', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Servicios premium del creador
CREATE TABLE IF NOT EXISTS creator_premium_services (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(200) NOT NULL,
    service_type VARCHAR(50), -- 'tutoring', 'consultation', 'coaching', 'certification', 'masterclass'
    
    -- Configuración del servicio
    description TEXT,
    price DECIMAL(8,2),
    duration_minutes INTEGER,
    max_participants INTEGER DEFAULT 1,
    
    -- Configuración de disponibilidad
    availability_schedule JSONB, -- Horarios disponibles
    booking_advance_days INTEGER DEFAULT 7,
    cancellation_policy TEXT,
    
    -- Materiales y recursos
    included_materials JSONB,
    prerequisites TEXT,
    certification_provided BOOLEAN DEFAULT false,
    
    -- Métricas de rendimiento
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    completion_rate DECIMAL(5,2),
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Reservas de servicios premium
CREATE TABLE IF NOT EXISTS service_bookings (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES creator_premium_services(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Detalles de la reserva
    scheduled_date TIMESTAMP,
    duration_minutes INTEGER,
    total_price DECIMAL(8,2),
    payment_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'refunded'
    
    -- Estado de la sesión
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
    meeting_link TEXT,
    meeting_notes TEXT,
    
    -- Evaluación
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    user_feedback TEXT,
    creator_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Productos digitales del creador
CREATE TABLE IF NOT EXISTS creator_digital_products (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(200) NOT NULL,
    product_type VARCHAR(50), -- 'ebook', 'guide', 'template', 'course', 'certification'
    
    -- Información del producto
    description TEXT,
    price DECIMAL(8,2),
    digital_file_url TEXT,
    preview_content TEXT,
    
    -- Configuración de acceso
    access_duration_days INTEGER, -- NULL = permanent access
    download_limit INTEGER, -- NULL = unlimited
    sharing_allowed BOOLEAN DEFAULT false,
    
    -- Métricas de ventas
    total_sales INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    average_rating DECIMAL(3,2),
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Suscripciones premium
CREATE TABLE IF NOT EXISTS creator_subscriptions (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- Configuración de suscripción
    subscription_type VARCHAR(50), -- 'monthly', 'quarterly', 'yearly'
    monthly_price DECIMAL(8,2),
    benefits JSONB, -- Lista de beneficios incluidos
    
    -- Estado de la suscripción
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'paused'
    
    -- Métricas
    payments_count INTEGER DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Analytics de contenido detallado
CREATE TABLE IF NOT EXISTS content_analytics (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    
    -- Métricas de rendimiento por día
    date_recorded DATE DEFAULT CURRENT_DATE,
    unique_players INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    avg_session_duration DECIMAL(8,2),
    completion_rate DECIMAL(5,2),
    
    -- Métricas de engagement
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    difficulty_feedback JSONB, -- Feedback sobre dificultad por pregunta
    user_ratings JSONB, -- Ratings recibidos
    
    -- Métricas financieras
    revenue_generated DECIMAL(8,2) DEFAULT 0,
    conversions_to_premium INTEGER DEFAULT 0,
    
    -- Análisis de abandono
    dropout_points JSONB, -- Puntos donde usuarios abandonan
    improvement_suggestions JSONB, -- Sugerencias automáticas
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Configuración de precios dinámicos
CREATE TABLE IF NOT EXISTS dynamic_pricing (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER, -- ID del bloque, servicio o producto
    item_type VARCHAR(50), -- 'block', 'service', 'product', 'subscription'
    
    -- Configuración de pricing
    base_price DECIMAL(8,2),
    current_price DECIMAL(8,2),
    min_price DECIMAL(8,2),
    max_price DECIMAL(8,2),
    
    -- Factores de ajuste
    demand_multiplier DECIMAL(3,2) DEFAULT 1.0,
    competition_factor DECIMAL(3,2) DEFAULT 1.0,
    seasonal_factor DECIMAL(3,2) DEFAULT 1.0,
    
    -- Métricas de performance
    conversion_rate DECIMAL(5,2),
    price_elasticity DECIMAL(5,2),
    optimal_price_estimate DECIMAL(8,2),
    
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Automatización de marketing
CREATE TABLE IF NOT EXISTS marketing_automation (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    automation_name VARCHAR(200) NOT NULL,
    automation_type VARCHAR(50), -- 'funnel', 'trigger', 'lifecycle', 'retargeting'
    
    -- Configuración del trigger
    trigger_conditions JSONB, -- Condiciones que activan la automatización
    target_audience JSONB, -- Criterios de segmentación
    
    -- Configuración de acciones
    action_sequence JSONB, -- Secuencia de acciones a ejecutar
    delay_between_actions INTEGER DEFAULT 0, -- Delay en horas
    
    -- Métricas de rendimiento
    total_triggered INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2),
    revenue_attributed DECIMAL(10,2) DEFAULT 0,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- TABLA: Oportunidades de mercado identificadas
CREATE TABLE IF NOT EXISTS market_opportunities (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    opportunity_type VARCHAR(50), -- 'niche_gap', 'trending_topic', 'underpriced_market', 'seasonal'
    
    -- Descripción de la oportunidad
    title VARCHAR(200) NOT NULL,
    description TEXT,
    market_size_estimate INTEGER,
    competition_level VARCHAR(20), -- 'low', 'medium', 'high'
    
    -- Métricas de la oportunidad
    estimated_revenue_potential DECIMAL(10,2),
    confidence_score DECIMAL(3,2), -- 0-1
    urgency_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    
    -- Recomendaciones
    recommended_actions JSONB,
    estimated_investment DECIMAL(8,2),
    expected_roi DECIMAL(5,2),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'identified', -- 'identified', 'in_progress', 'completed', 'dismissed'
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- TABLA: Configuración de A/B testing
CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_name VARCHAR(200) NOT NULL,
    test_type VARCHAR(50), -- 'price', 'content', 'marketing', 'ui'
    
    -- Configuración del test
    item_id INTEGER, -- ID del elemento siendo testeado
    item_type VARCHAR(50), -- 'block', 'campaign', 'service'
    variant_a JSONB, -- Configuración de variante A
    variant_b JSONB, -- Configuración de variante B
    
    -- Configuración de tráfico
    traffic_split DECIMAL(3,2) DEFAULT 0.5, -- 0.5 = 50/50 split
    min_sample_size INTEGER DEFAULT 100,
    confidence_level DECIMAL(3,2) DEFAULT 0.95,
    
    -- Métricas de resultado
    variant_a_conversions INTEGER DEFAULT 0,
    variant_b_conversions INTEGER DEFAULT 0,
    variant_a_revenue DECIMAL(10,2) DEFAULT 0,
    variant_b_revenue DECIMAL(10,2) DEFAULT 0,
    statistical_significance DECIMAL(5,4),
    
    -- Estado
    status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'paused'
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA OPTIMIZACIÓN DE CONSULTAS
-- ========================================

-- Índices para analytics de mercado
CREATE INDEX IF NOT EXISTS idx_market_analytics_creator_date ON creator_market_analytics(creator_id, date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_market_analytics_rank ON creator_market_analytics(market_rank, category_rank);

-- Índices para competidores
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_creator ON competitor_analysis(creator_id);
CREATE INDEX IF NOT EXISTS idx_competitor_analysis_competitor ON competitor_analysis(competitor_id);

-- Índices para campañas
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_active ON marketing_campaigns(creator_id, is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON marketing_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON marketing_campaigns(campaign_type);

-- Índices para torneos
CREATE INDEX IF NOT EXISTS idx_tournaments_creator_status ON marketing_tournaments(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_tournaments_dates ON marketing_tournaments(start_date, end_date);

-- Índices para servicios premium
CREATE INDEX IF NOT EXISTS idx_premium_services_creator_active ON creator_premium_services(creator_id, is_active);
CREATE INDEX IF NOT EXISTS idx_service_bookings_creator ON service_bookings(creator_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_user ON service_bookings(user_id);

-- Índices para productos digitales
CREATE INDEX IF NOT EXISTS idx_digital_products_creator_active ON creator_digital_products(creator_id, is_active);

-- Índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_status ON creator_subscriptions(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON creator_subscriptions(user_id);

-- Índices para analytics de contenido
CREATE INDEX IF NOT EXISTS idx_content_analytics_creator_date ON content_analytics(creator_id, date_recorded DESC);
CREATE INDEX IF NOT EXISTS idx_content_analytics_block ON content_analytics(block_id, date_recorded DESC);

-- Índices para pricing dinámico
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_creator_item ON dynamic_pricing(creator_id, item_type, item_id);

-- Índices para automatización
CREATE INDEX IF NOT EXISTS idx_marketing_automation_creator_active ON marketing_automation(creator_id, is_active);

-- Índices para oportunidades
CREATE INDEX IF NOT EXISTS idx_market_opportunities_creator_status ON market_opportunities(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_market_opportunities_urgency ON market_opportunities(urgency_level, created_at DESC);

-- Índices para A/B tests
CREATE INDEX IF NOT EXISTS idx_ab_tests_creator_status ON ab_tests(creator_id, status);

-- ========================================
-- FUNCIONES DE UTILIDAD Y TRIGGERS
-- ========================================

-- Función para calcular métricas de mercado automáticamente
CREATE OR REPLACE FUNCTION calculate_market_metrics(creator_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    total_creators INTEGER;
    creator_rank INTEGER;
    creator_revenue DECIMAL(10,2);
    market_total_revenue DECIMAL(10,2);
BEGIN
    -- Calcular ranking de mercado
    SELECT COUNT(*) INTO total_creators FROM users WHERE id IN (
        SELECT DISTINCT creator_id FROM blocks WHERE is_public = true
    );
    
    -- Calcular revenue del creador (simulado con luminarias por ahora)
    SELECT COALESCE(actuales, 0) INTO creator_revenue 
    FROM user_luminarias WHERE user_id = creator_id_param;
    
    -- Calcular ranking basado en revenue
    SELECT COUNT(*) + 1 INTO creator_rank
    FROM user_luminarias ul
    JOIN users u ON ul.user_id = u.id
    WHERE ul.actuales > creator_revenue
    AND u.id IN (SELECT DISTINCT creator_id FROM blocks WHERE is_public = true);
    
    -- Insertar o actualizar métricas
    INSERT INTO creator_market_analytics (
        creator_id, market_rank, revenue_current_month, total_blocks, created_at
    ) VALUES (
        creator_id_param, creator_rank, creator_revenue, 
        (SELECT COUNT(*) FROM blocks WHERE creator_id = creator_id_param AND is_public = true),
        NOW()
    ) ON CONFLICT (creator_id, date_recorded) DO UPDATE SET
        market_rank = EXCLUDED.market_rank,
        revenue_current_month = EXCLUDED.revenue_current_month,
        total_blocks = EXCLUDED.total_blocks,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Función para detectar oportunidades de mercado automáticamente
CREATE OR REPLACE FUNCTION detect_market_opportunities()
RETURNS VOID AS $$
DECLARE
    opportunity_record RECORD;
BEGIN
    -- Detectar nichos con poca competencia
    FOR opportunity_record IN
        SELECT 
            ka.name as area_name,
            COUNT(DISTINCT b.creator_id) as creator_count,
            COUNT(b.id) as block_count,
            AVG(COALESCE(ul.actuales, 0)) as avg_revenue
        FROM knowledge_areas ka
        LEFT JOIN blocks b ON ka.id = b.knowledge_area_id AND b.is_public = true
        LEFT JOIN user_luminarias ul ON b.creator_id = ul.user_id
        GROUP BY ka.id, ka.name
        HAVING COUNT(DISTINCT b.creator_id) < 3 AND COUNT(b.id) < 10
    LOOP
        INSERT INTO market_opportunities (
            creator_id, opportunity_type, title, description, 
            market_size_estimate, competition_level, confidence_score, urgency_level
        ) 
        SELECT 
            u.id, 'niche_gap', 
            'Oportunidad en ' || opportunity_record.area_name,
            'Área con baja competencia y potencial de crecimiento',
            100, 'low', 0.75, 'medium'
        FROM users u
        WHERE u.id IN (SELECT DISTINCT creator_id FROM blocks WHERE is_public = true)
        AND NOT EXISTS (
            SELECT 1 FROM market_opportunities mo 
            WHERE mo.creator_id = u.id 
            AND mo.title LIKE '%' || opportunity_record.area_name || '%'
            AND mo.created_at > NOW() - INTERVAL '30 days'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas relevantes
DO $$
DECLARE
    table_name TEXT;
    tables_with_updated_at TEXT[] := ARRAY[
        'creator_market_analytics', 'marketing_campaigns', 'marketing_tournaments',
        'creator_premium_services', 'service_bookings', 'creator_digital_products',
        'creator_subscriptions', 'dynamic_pricing', 'marketing_automation', 'ab_tests'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables_with_updated_at
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trigger_update_%s_updated_at ON %s;
            CREATE TRIGGER trigger_update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', table_name, table_name, table_name, table_name);
    END LOOP;
END $$;
-- =====================================================
-- SISTEMA DE NOTIFICACIONES PUSH
-- =====================================================

-- Tabla de tokens/player_ids de dispositivos
CREATE TABLE IF NOT EXISTS user_push_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,  -- OneSignal Player ID o FCM Token
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('web', 'ios', 'android')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, player_id)
);

-- Tabla de log de notificaciones enviadas
CREATE TABLE IF NOT EXISTS push_notifications_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('onesignal', 'fcm')),
    player_ids JSONB NOT NULL,  -- Array de player_ids a los que se envió
    success BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de notificaciones programadas
CREATE TABLE IF NOT EXISTS scheduled_push_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    notification_title VARCHAR(200) NOT NULL,
    notification_body TEXT NOT NULL,
    notification_data JSONB,
    scheduled_for TIMESTAMP NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user ON user_push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_active ON user_push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_log_user ON push_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent_at ON push_notifications_log(sent_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_push_sent ON scheduled_push_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_scheduled_push_for ON scheduled_push_notifications(scheduled_for);

COMMENT ON TABLE user_push_tokens IS 'Tokens de dispositivos para notificaciones push';
COMMENT ON TABLE push_notifications_log IS 'Log de todas las notificaciones push enviadas';
COMMENT ON TABLE scheduled_push_notifications IS 'Notificaciones programadas para enviar en el futuro';

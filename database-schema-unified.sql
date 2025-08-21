-- PLAYTEST Unified Database Schema - PostgreSQL
-- This script aligns the existing database with the provided target schema
-- Run this script to ensure consistency across all tables and fields

-- ==================== CORE TABLES (Updated to match provided schema) ====================

-- 1. Users table - Update column names to match provided schema
DO $$ 
BEGIN
    -- Add first_name and last_name columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
    END IF;
    
    -- Migrate data from nombre/apellido to first_name/last_name if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nombre') THEN
        UPDATE users SET first_name = nombre WHERE nombre IS NOT NULL AND first_name IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'apellido') THEN
        UPDATE users SET last_name = apellido WHERE apellido IS NOT NULL AND last_name IS NULL;
    END IF;
END $$;

-- Ensure users table matches provided schema exactly
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    first_name VARCHAR(100),
    last_name VARCHAR(100)
);

-- 2. User profiles table - matches provided schema
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    answer_history JSONB DEFAULT '[]',
    stats JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    loaded_blocks JSONB DEFAULT '[]'
);

-- 3. Roles table - matches provided schema
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. User roles table - matches provided schema
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);

-- 5. Blocks table - restructured to use user_role_id as reference to user_roles (eliminates creator_id redundancy)
DO $$
BEGIN
    -- Add user_role_id column if it doesn't exist (references user_roles table)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blocks' AND column_name = 'user_role_id') THEN
        ALTER TABLE blocks ADD COLUMN user_role_id INTEGER REFERENCES user_roles(id);
    END IF;
    
    -- Add observaciones column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blocks' AND column_name = 'observaciones') THEN
        ALTER TABLE blocks ADD COLUMN observaciones TEXT;
    END IF;
    
    -- Migrate existing data from creator_id to user_role_id if needed
    -- This will populate user_role_id based on creator_id and their primary role
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blocks' AND column_name = 'creator_id')
       AND EXISTS (SELECT 1 FROM blocks WHERE user_role_id IS NULL AND creator_id IS NOT NULL) THEN
        
        UPDATE blocks SET user_role_id = (
            SELECT ur.id 
            FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id 
            WHERE ur.user_id = blocks.creator_id 
            ORDER BY CASE 
                WHEN r.name = 'administrador_principal' THEN 1
                WHEN r.name = 'administrador_secundario' THEN 2
                WHEN r.name = 'creador_contenido' THEN 3
                WHEN r.name = 'profesor' THEN 4
                ELSE 5 
            END
            LIMIT 1
        ) WHERE user_role_id IS NULL AND creator_id IS NOT NULL;
    END IF;
    
    -- Remove creator_id column after migration (it's now redundant)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blocks' AND column_name = 'creator_id') THEN
        ALTER TABLE blocks DROP COLUMN creator_id;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS blocks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    user_role_id INTEGER REFERENCES user_roles(id) NOT NULL,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,
    observaciones TEXT
);

-- 6. Questions table - matches provided schema
CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    text_question TEXT NOT NULL,
    topic VARCHAR(100),
    difficulty INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    explanation TEXT
);

-- 7. Answers table - matches provided schema
CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Games table - matches provided schema
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    config JSONB DEFAULT '{}',
    game_state JSONB DEFAULT '{}',
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Game players table - matches provided schema
CREATE TABLE IF NOT EXISTS game_players (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    player_index INTEGER NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Game scores table - matches provided schema
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    score_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. User sessions table - matches provided schema
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. User game configurations table - NEW from provided schema
CREATE TABLE IF NOT EXISTS user_game_configurations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL,
    config JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    use_count INTEGER DEFAULT 0
);

-- 13. Block answers table - matches provided schema  
CREATE TABLE IF NOT EXISTS block_answers (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    total_questions INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. Topic answers table - matches provided schema
CREATE TABLE IF NOT EXISTS topic_answers (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    total_questions INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id, topic)
);

-- ==================== TICKET SYSTEM TABLES (from provided schema) ====================

-- 15. Admin assignments table - NEW from provided schema
CREATE TABLE IF NOT EXISTS admin_assignments (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. Ticket categories table - NEW from provided schema
CREATE TABLE IF NOT EXISTS ticket_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    origin VARCHAR(50),
    priority INTEGER DEFAULT 1,
    redirect_to_category_id INTEGER REFERENCES ticket_categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 17. Ticket states table - NEW from provided schema
CREATE TABLE IF NOT EXISTS ticket_states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18. Tickets table - NEW from provided schema
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    creator_id INTEGER REFERENCES users(id) NOT NULL,
    assigned_user_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES ticket_categories(id),
    state_id INTEGER REFERENCES ticket_states(id),
    origin VARCHAR(50),
    block_id INTEGER REFERENCES blocks(id),
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 19. Ticket messages table - NEW from provided schema
CREATE TABLE IF NOT EXISTS ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT false
);

-- 20. Ticket assignments table - NEW from provided schema
CREATE TABLE IF NOT EXISTS ticket_assignments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    admin_id INTEGER REFERENCES users(id) NOT NULL,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Ticket attachments table - NEW from provided schema
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES ticket_messages(id),
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Ticket notifications table - NEW from provided schema
CREATE TABLE IF NOT EXISTS ticket_notifications (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== FEATURE FLAGS TABLE (from provided schema) ====================

-- 23. Feature flags table - NEW from provided schema
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100),
    feature_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT false,
    dependencies JSONB DEFAULT '[]',
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    user_segments JSONB DEFAULT '[]',
    environment VARCHAR(50) DEFAULT 'production',
    scheduled_activation TIMESTAMP,
    scheduled_deactivation TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id),
    rollback_config JSONB DEFAULT '{}',
    ab_test_config JSONB DEFAULT '{}',
    UNIQUE(feature_key, environment)
);

-- ==================== INDEXES FOR PERFORMANCE ====================

-- Core table indexes
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users(nickname);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Block-related indexes
CREATE INDEX IF NOT EXISTS idx_blocks_user_role_id ON blocks(user_role_id);
CREATE INDEX IF NOT EXISTS idx_blocks_is_public ON blocks(is_public);
CREATE INDEX IF NOT EXISTS idx_questions_block_id ON questions(block_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_block_answers_block_id ON block_answers(block_id);
CREATE INDEX IF NOT EXISTS idx_topic_answers_block_id ON topic_answers(block_id);

-- Game-related indexes
CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON game_players(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_id ON game_scores(game_id);
CREATE INDEX IF NOT EXISTS idx_user_game_configs_user_id ON user_game_configurations(user_id);

-- Ticket system indexes
CREATE INDEX IF NOT EXISTS idx_admin_assignments_admin_id ON admin_assignments(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_assignments_user_id ON admin_assignments(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_creator_id ON tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_user_id ON tickets(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets(category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_state_id ON tickets(state_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_assignments_ticket_id ON ticket_assignments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_notifications_user_id ON ticket_notifications(user_id);

-- Feature flags indexes
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment ON feature_flags(environment);

-- ==================== DEFAULT DATA ====================

-- Insert default roles if they don't exist
INSERT INTO roles (name, description) VALUES
    ('administrador_principal', 'Administrator with full system access'),
    ('administrador_secundario', 'Secondary administrator with limited access'),
    ('creador_contenido', 'Content creator with block creation permissions'),
    ('profesor', 'Teacher with student management permissions'),
    ('usuario', 'Regular user with basic access')
ON CONFLICT (name) DO NOTHING;

-- Insert default ticket states
INSERT INTO ticket_states (name, description) VALUES
    ('abierto', 'Ticket is open and waiting for attention'),
    ('en_progreso', 'Ticket is being worked on'),
    ('esperando_usuario', 'Waiting for user response'),
    ('resuelto', 'Ticket has been resolved'),
    ('cerrado', 'Ticket is closed')
ON CONFLICT DO NOTHING;

-- Insert default ticket categories
INSERT INTO ticket_categories (name, origin, priority) VALUES
    ('Bug Report', 'user', 2),
    ('Feature Request', 'user', 1),
    ('Technical Support', 'user', 2),
    ('Account Issues', 'user', 3),
    ('General Inquiry', 'user', 1)
ON CONFLICT DO NOTHING;

-- ==================== TRIGGERS AND FUNCTIONS ====================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocks_updated_at ON blocks;
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to maintain block_answers and topic_answers counts
CREATE OR REPLACE FUNCTION update_question_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Update topic_answers
        UPDATE topic_answers 
        SET total_questions = total_questions - 1, updated_at = CURRENT_TIMESTAMP
        WHERE block_id = OLD.block_id AND topic = OLD.topic;
        
        -- Remove topic if no questions left
        DELETE FROM topic_answers 
        WHERE block_id = OLD.block_id AND topic = OLD.topic AND total_questions <= 0;
        
        -- Update block_answers
        UPDATE block_answers 
        SET total_questions = total_questions - 1, updated_at = CURRENT_TIMESTAMP
        WHERE block_id = OLD.block_id;
        
        RETURN OLD;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        -- Update topic_answers
        INSERT INTO topic_answers (block_id, topic, total_questions)
        VALUES (NEW.block_id, NEW.topic, 1)
        ON CONFLICT (block_id, topic) 
        DO UPDATE SET total_questions = topic_answers.total_questions + 1, updated_at = CURRENT_TIMESTAMP;
        
        -- Update block_answers
        INSERT INTO block_answers (block_id, total_questions)
        VALUES (NEW.block_id, 1)
        ON CONFLICT (block_id)
        DO UPDATE SET total_questions = block_answers.total_questions + 1, updated_at = CURRENT_TIMESTAMP;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger for question count maintenance
DROP TRIGGER IF EXISTS trigger_update_question_counts ON questions;
CREATE TRIGGER trigger_update_question_counts
    AFTER INSERT OR DELETE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_question_counts();

-- ==================== VIEWS FOR COMPATIBILITY ====================

-- Create a view to help with migration from existing queries
CREATE OR REPLACE VIEW blocks_with_stats AS
SELECT 
    b.*,
    COALESCE(ba.total_questions, 0) as question_count,
    u.nickname as creator_nickname,
    u.id as creator_id, -- Virtual creator_id for compatibility
    r.name as created_with_role
FROM blocks b
LEFT JOIN block_answers ba ON b.id = ba.block_id
LEFT JOIN user_roles ur ON b.user_role_id = ur.id
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id;

COMMENT ON TABLE users IS 'Core user accounts with authentication information';
COMMENT ON TABLE user_profiles IS 'Extended user data including game history and preferences';
COMMENT ON TABLE blocks IS 'Question blocks/topics created by users';
COMMENT ON TABLE questions IS 'Individual questions within blocks';
COMMENT ON TABLE answers IS 'Answer choices for questions';
COMMENT ON TABLE games IS 'Game sessions and their configuration';
COMMENT ON TABLE tickets IS 'Support tickets and user requests';
COMMENT ON TABLE feature_flags IS 'System feature toggles and A/B testing configuration';

-- Initialize existing data counts
INSERT INTO block_answers (block_id, total_questions)
SELECT block_id, COUNT(*) as total_questions
FROM questions 
GROUP BY block_id
ON CONFLICT (block_id) DO UPDATE SET total_questions = EXCLUDED.total_questions;

INSERT INTO topic_answers (block_id, topic, total_questions)
SELECT block_id, topic, COUNT(*) as total_questions
FROM questions 
WHERE topic IS NOT NULL
GROUP BY block_id, topic
ON CONFLICT (block_id, topic) DO UPDATE SET total_questions = EXCLUDED.total_questions;

-- Clean up old columns that don't match the provided schema
DO $$
BEGIN
    -- Drop old columns that aren't in the provided schema
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'nombre') THEN
        ALTER TABLE users DROP COLUMN nombre;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'apellido') THEN
        ALTER TABLE users DROP COLUMN apellido;
    END IF;
END $$;

COMMENT ON SCHEMA public IS 'PLAYTEST unified database schema aligned with target specification';
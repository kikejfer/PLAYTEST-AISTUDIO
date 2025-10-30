-- Database Schema Updates - PlayTest Simplification
-- New tables and fields added for better statistics and user management

-- 1. New table: topic_answers
-- Stores the number of questions per topic for each block
CREATE TABLE IF NOT EXISTS topic_answers (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    topic VARCHAR(100) NOT NULL,
    question_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id, topic)
);

-- 2. New table: block_answers  
-- Stores the total number of questions per block
CREATE TABLE IF NOT EXISTS block_answers (
    id SERIAL PRIMARY KEY,
    block_id INTEGER REFERENCES blocks(id) ON DELETE CASCADE,
    total_questions INTEGER DEFAULT 0,
    total_topics INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(block_id)
);

-- 3. Add name and surname fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS nombre VARCHAR(100),
ADD COLUMN IF NOT EXISTS apellido VARCHAR(100);

-- 4. Add observations field to blocks table
ALTER TABLE blocks 
ADD COLUMN IF NOT EXISTS observaciones TEXT;

-- 5. Add user_role_id field to blocks table to track creation role
ALTER TABLE blocks 
ADD COLUMN IF NOT EXISTS user_role_id INTEGER REFERENCES roles(id);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_topic_answers_block_id ON topic_answers(block_id);
CREATE INDEX IF NOT EXISTS idx_topic_answers_topic ON topic_answers(topic);
CREATE INDEX IF NOT EXISTS idx_block_answers_block_id ON block_answers(block_id);
CREATE INDEX IF NOT EXISTS idx_blocks_user_role_id ON blocks(user_role_id);

-- Function to update topic_answers and block_answers when questions are added/removed
CREATE OR REPLACE FUNCTION update_question_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update topic_answers
    IF TG_OP = 'DELETE' THEN
        -- Remove from topic count
        UPDATE topic_answers 
        SET question_count = question_count - 1, updated_at = CURRENT_TIMESTAMP
        WHERE block_id = OLD.block_id AND topic = OLD.topic;
        
        -- Remove topic if no questions left
        DELETE FROM topic_answers 
        WHERE block_id = OLD.block_id AND topic = OLD.topic AND question_count <= 0;
        
        -- Update block_answers
        UPDATE block_answers 
        SET total_questions = total_questions - 1, updated_at = CURRENT_TIMESTAMP
        WHERE block_id = OLD.block_id;
        
        RETURN OLD;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        -- Add to topic count
        INSERT INTO topic_answers (block_id, topic, question_count)
        VALUES (NEW.block_id, NEW.topic, 1)
        ON CONFLICT (block_id, topic) 
        DO UPDATE SET question_count = topic_answers.question_count + 1, updated_at = CURRENT_TIMESTAMP;
        
        -- Update block_answers
        INSERT INTO block_answers (block_id, total_questions, total_topics)
        VALUES (NEW.block_id, 1, 1)
        ON CONFLICT (block_id)
        DO UPDATE SET 
            total_questions = block_answers.total_questions + 1,
            total_topics = (SELECT COUNT(DISTINCT topic) FROM topic_answers WHERE block_id = NEW.block_id),
            updated_at = CURRENT_TIMESTAMP;
            
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        -- Handle topic change
        IF OLD.topic != NEW.topic THEN
            -- Remove from old topic
            UPDATE topic_answers 
            SET question_count = question_count - 1, updated_at = CURRENT_TIMESTAMP
            WHERE block_id = OLD.block_id AND topic = OLD.topic;
            
            DELETE FROM topic_answers 
            WHERE block_id = OLD.block_id AND topic = OLD.topic AND question_count <= 0;
            
            -- Add to new topic
            INSERT INTO topic_answers (block_id, topic, question_count)
            VALUES (NEW.block_id, NEW.topic, 1)
            ON CONFLICT (block_id, topic) 
            DO UPDATE SET question_count = topic_answers.question_count + 1, updated_at = CURRENT_TIMESTAMP;
            
            -- Update total topics count
            UPDATE block_answers 
            SET total_topics = (SELECT COUNT(DISTINCT topic) FROM topic_answers WHERE block_id = NEW.block_id),
                updated_at = CURRENT_TIMESTAMP
            WHERE block_id = NEW.block_id;
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update counts
DROP TRIGGER IF EXISTS trigger_update_question_counts ON questions;
CREATE TRIGGER trigger_update_question_counts
    AFTER INSERT OR UPDATE OR DELETE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_question_counts();

-- Initialize data for existing questions
INSERT INTO topic_answers (block_id, topic, question_count)
SELECT block_id, topic, COUNT(*) as question_count
FROM questions 
GROUP BY block_id, topic
ON CONFLICT (block_id, topic) DO NOTHING;

INSERT INTO block_answers (block_id, total_questions, total_topics)
SELECT 
    block_id, 
    COUNT(*) as total_questions,
    COUNT(DISTINCT topic) as total_topics
FROM questions 
GROUP BY block_id
ON CONFLICT (block_id) DO NOTHING;
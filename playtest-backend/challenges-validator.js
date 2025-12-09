const { Pool } = require('pg');

// This class is now corrected to receive the database pool via its constructor.
// This ensures it uses the single, centralized, and safely initialized connection.
class ChallengesValidator {
    constructor(pool) {
        if (!pool) {
            throw new Error("ChallengesValidator requires a database pool on construction.");
        }
        this.pool = pool;
    }

    // All the other methods in this class will now use `this.pool`,
    // which is the correct, centralized connection pool.

    // ==================== VALIDADORES POR TIPO DE RETO ====================

    async validateMarathonChallenge(participantId, challengeConfig) {
        try {
            const participant = await this.getParticipantData(participantId);
            const { required_blocks, min_average_score, max_attempts_per_block, must_complete_all } = challengeConfig;

            let completedBlocks = 0;
            let totalScore = 0;
            let totalAttempts = 0;
            let blocksProgress = {};

            for (const blockId of required_blocks) {
                const gameHistory = await this.pool.query(`
                    SELECT g.id, g.created_at, gs.score
                    FROM games g
                    JOIN game_players gp ON g.id = gp.game_id
                    LEFT JOIN game_scores gs ON g.id = gs.game_id AND gs.user_id = gp.user_id
                    WHERE gp.user_id = $1 AND g.config ? $2 AND g.status = 'completed' AND g.created_at > $3
                    ORDER BY g.created_at DESC
                `, [participant.user_id, blockId.toString(), participant.started_at]);

                const attempts = gameHistory.rows.length;
                totalAttempts += attempts;

                if (attempts > 0) {
                    const bestScore = Math.max(...gameHistory.rows.map(g => g.score || 0));
                    totalScore += bestScore;
                    
                    if (bestScore >= min_average_score && attempts <= max_attempts_per_block) {
                        completedBlocks++;
                    }
                    blocksProgress[blockId] = { attempts, best_score: bestScore, completed: bestScore >= min_average_score };
                } else {
                    blocksProgress[blockId] = { attempts: 0, best_score: 0, completed: false };
                }
            }

            const averageScore = required_blocks.length > 0 ? totalScore / required_blocks.length : 0;
            const isCompleted = must_complete_all ? (completedBlocks === required_blocks.length) : (completedBlocks > 0 && averageScore >= min_average_score);

            return { isCompleted, progress: { completed_blocks: completedBlocks, total_blocks: required_blocks.length, average_score: averageScore, progress_percentage: (completedBlocks / required_blocks.length) * 100 } };
        } catch (error) {
            console.error('Error validating marathon challenge:', error);
            throw error;
        }
    }

    async awardPrize(participantId) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            const participantResult = await client.query(`
                SELECT cp.*, c.prize_luminarias, c.bonus_luminarias, c.creator_id
                FROM challenge_participants cp JOIN challenges c ON cp.challenge_id = c.id
                WHERE cp.id = $1 AND cp.status = 'active'
            `, [participantId]);

            if (participantResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return;
            }

            const participant = participantResult.rows[0];
            const totalPrize = participant.prize_luminarias + (participant.bonus_luminarias || 0);

            await client.query(`
                UPDATE user_profiles SET luminarias_actuales = COALESCE(luminarias_actuales, 0) + $1
                WHERE user_id = $2
            `, [totalPrize, participant.user_id]);

            await client.query(`
                INSERT INTO challenge_transfers (challenge_id, from_user_id, to_user_id, amount, transfer_type)
                VALUES ($1, $2, $3, $4, 'award')
            `, [participant.challenge_id, participant.creator_id, participant.user_id, totalPrize]);

            await client.query(`
                UPDATE challenge_participants SET status = 'completed', completed_at = CURRENT_TIMESTAMP, prize_awarded = $1
                WHERE id = $2
            `, [totalPrize, participantId]);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error awarding prize:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    // ... rest of the methods remain unchanged as they correctly use this.pool ...
     async getParticipantData(participantId) {
        const result = await this.pool.query(`
            SELECT cp.*, c.challenge_type, c.config
            FROM challenge_participants cp
            JOIN challenges c ON cp.challenge_id = c.id
            WHERE cp.id = $1
        `, [participantId]);

        if (result.rows.length === 0) {
            throw new Error('Participante no encontrado');
        }

        return result.rows[0];
    }

    async processAutomaticValidation(participantId) {
        const participant = await this.getParticipantData(participantId);
        const challengeConfig = participant.config;
        let validationResult;
        switch (participant.challenge_type) {
            case 'marathon':
                validationResult = await this.validateMarathonChallenge(participantId, challengeConfig);
                break;
            // ... other cases
            default:
                throw new Error('Tipo de reto no válido');
        }
        await this.pool.query(`
            UPDATE challenge_participants 
            SET progress = $1, current_metrics = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [JSON.stringify(validationResult.progress), JSON.stringify(validationResult.progress), participantId]);
        if (validationResult.isCompleted && participant.status !== 'completed') {
            await this.awardPrize(participantId);
        }
        return validationResult;
    }

    async runPeriodicValidations() {
        const activeParticipants = await this.pool.query(`
            SELECT cp.id FROM challenge_participants cp JOIN challenges c ON cp.challenge_id = c.id
            WHERE cp.status = 'active' AND c.status = 'active' AND c.end_date > CURRENT_TIMESTAMP
        `);
        for (const participant of activeParticipants.rows) {
            try {
                await this.processAutomaticValidation(participant.id);
            } catch (error) {
                console.error(`Error validating participant ${participant.id}:`, error);
            }
        }
    }
}

module.exports = ChallengesValidator;
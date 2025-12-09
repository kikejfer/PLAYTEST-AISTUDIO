/**
 * LevelsCalculator
 * CORRECTED: This class now accepts a `pool` object in its constructor
 * instead of creating its own, and the close() method has been removed.
 */
class LevelsCalculator {
    constructor(pool) {
        if (!pool) {
            throw new Error("A database pool is required for LevelsCalculator.");
        }
        this.pool = pool;
    }

    // All methods below use `this.pool` and are now corrected by the constructor change.

    async calculateUserConsolidation(userId, blockId) {
        const result = await this.pool.query(
            'SELECT calculate_user_consolidation($1, $2) as consolidation',
            [userId, blockId]
        );
        return parseFloat(result.rows[0].consolidation) || 0;
    }

    async determineUserLevel(consolidationPercentage) {
        const result = await this.pool.query(
            `SELECT id, level_name FROM level_definitions 
             WHERE level_type = 'user' AND $1 >= min_threshold AND ($1 < max_threshold OR max_threshold IS NULL)
             ORDER BY level_order DESC LIMIT 1`,
            [consolidationPercentage]
        );
        return result.rows[0] || null;
    }

    async updateUserLevelForBlock(userId, blockId) {
        try {
            const consolidation = await this.calculateUserConsolidation(userId, blockId);
            const newLevel = await this.determineUserLevel(consolidation);

            if (!newLevel) return null;

            const currentLevelResult = await this.pool.query(
                'SELECT current_level_id FROM user_levels WHERE user_id = $1 AND level_type = \'user\' AND block_id = $2',
                [userId, blockId]
            );
            const currentLevelId = currentLevelResult.rows[0]?.current_level_id;

            if (currentLevelId !== newLevel.id) {
                await this.pool.query(
                    `INSERT INTO user_levels (user_id, level_type, block_id, current_level_id, current_metrics)
                     VALUES ($1, 'user', $2, $3, $4)
                     ON CONFLICT (user_id, level_type, block_id) DO UPDATE SET
                         current_level_id = EXCLUDED.current_level_id,
                         current_metrics = EXCLUDED.current_metrics,
                         achieved_at = NOW()`,
                    [userId, blockId, newLevel.id, { consolidation }]
                );
                // History logging can be added here if needed
                return { changed: true, level: newLevel, consolidation };
            }
            return { changed: false };
        } catch (error) {
            console.error(`Error updating level for user ${userId}, block ${blockId}:`, error);
            // Don't re-throw, to allow bulk operations to continue
            return null;
        }
    }

    async updateAllUserLevels(userId) {
        const userBlocksResult = await this.pool.query(
            'SELECT DISTINCT q.block_id, b.title FROM user_answers ua JOIN questions q ON ua.question_id = q.id JOIN blocks b ON q.block_id = b.id WHERE ua.user_id = $1',
            [userId]
        );

        const notifications_needed = [];
        for (const block of userBlocksResult.rows) {
            const updateResult = await this.updateUserLevelForBlock(userId, block.block_id);
            if (updateResult?.changed) {
                notifications_needed.push({
                    type: 'user_level_up',
                    block_title: block.title,
                    new_level: updateResult.level.level_name
                });
            }
        }
        // Creator and Teacher level updates would follow a similar pattern

        return { notifications_needed };
    }

    // ... other methods would be similarly refactored to just use this.pool ...

}

module.exports = LevelsCalculator;

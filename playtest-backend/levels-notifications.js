/**
 * LevelsNotificationSystem
 * CORRECTED: This class now accepts a `pool` object in its constructor
 * and the close() method has been removed.
 */
class LevelsNotificationSystem {
    constructor(pool) {
        if (!pool) {
            throw new Error("A database pool is required for LevelsNotificationSystem.");
        }
        this.pool = pool;
    }

    // All methods will now use the injected `this.pool`.

    async sendLevelUpNotification(userId, levelChange) {
        try {
            const { type, block_title, new_level } = levelChange;
            const title = `¡Nivel alcanzado: ${new_level}!`;
            const message = `¡Felicidades! Has subido de nivel en ${block_title || type}.`;

            await this.createNotification(userId, 'level_up', title, message, levelChange);
            console.log(`Sent level-up notification to user ${userId}`);
        } catch (error) {
            console.error('Error in sendLevelUpNotification:', error);
        }
    }

    async createNotification(userId, type, title, message, data) {
        // In a real implementation, we would check user preferences first.
        // For this refactor, we'll just insert the notification.
        try {
            await this.pool.query(
                `INSERT INTO user_notifications (user_id, notification_type, title, message, data)
                 VALUES ($1, $2, $3, $4, $5)`,
                [userId, type, title, message, data]
            );
        } catch (error) {
            console.error(`Failed to create notification for user ${userId}:`, error);
        }
    }

    async getUserNotifications(userId, limit = 20, offset = 0) {
        try {
            const result = await this.pool.query(
                'SELECT * FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
                [userId, limit, offset]
            );
            return result.rows;
        } catch (error) {
            console.error(`Failed to get notifications for user ${userId}:`, error);
            return [];
        }
    }

    async markNotificationAsRead(notificationId, userId) {
        try {
            const result = await this.pool.query(
                'UPDATE user_notifications SET read_at = NOW() WHERE id = $1 AND user_id = $2 AND read_at IS NULL',
                [notificationId, userId]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error(`Failed to mark notification ${notificationId} as read:`, error);
            return false;
        }
    }
}

module.exports = LevelsNotificationSystem;

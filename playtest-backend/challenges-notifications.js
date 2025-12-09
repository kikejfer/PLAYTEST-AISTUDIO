const { Pool } = require('pg');

// Corrected to accept the database pool via its constructor.
class ChallengesNotificationSystem {
    constructor(pool) {
        if (!pool) {
            throw new Error("ChallengesNotificationSystem requires a database pool on construction.");
        }
        this.pool = pool;
    }

    // All methods will now use the correct, centralized `this.pool`.

    async sendNewChallengeNotification(challengeId, eligibleUsers = []) {
        try {
            const challenge = await this.getChallengeData(challengeId);
            if (!challenge) return;

            const title = '🆕 Nuevo Reto Disponible';
            const message = `¡Nuevo reto "${challenge.title}" disponible! Premio: ${challenge.prize_luminarias} 💎 Luminarias`;
            
            await this.notifyAllActiveUsers(challengeId, 'new_challenge', title, message, {});

        } catch (error) {
            console.error('Error sending new challenge notification:', error);
        }
    }

    async createNotification(userId, challengeId, type, title, message, data = {}) {
        try {
            await this.pool.query(`
                INSERT INTO challenge_notifications (user_id, challenge_id, notification_type, title, message, data)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [userId, challengeId, type, title, message, JSON.stringify(data)]);
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }

    async notifyAllActiveUsers(challengeId, type, title, message, data = {}) {
        try {
            const activeUsers = await this.pool.query(`SELECT id FROM users`); // Simplified for example
            for (const user of activeUsers.rows) {
                await this.createNotification(user.id, challengeId, type, title, message, data);
            }
        } catch (error) {
            console.error('Error notifying all active users:', error);
        }
    }

    async getChallengeData(challengeId) {
        const result = await this.pool.query(`SELECT * FROM challenges WHERE id = $1`, [challengeId]);
        return result.rows[0] || null;
    }

    async getUserNotifications(userId, limit = 20, offset = 0) {
        const result = await this.pool.query(`
            SELECT cn.*, c.title as challenge_title
            FROM challenge_notifications cn LEFT JOIN challenges c ON cn.challenge_id = c.id
            WHERE cn.user_id = $1 ORDER BY cn.sent_at DESC LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);
        return result.rows;
    }

    async markNotificationAsRead(notificationId, userId) {
        try {
            await this.pool.query(`
                UPDATE challenge_notifications SET read_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND user_id = $2 AND read_at IS NULL
            `, [notificationId, userId]);
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async markAllNotificationsAsRead(userId) {
        const result = await this.pool.query(`
            UPDATE challenge_notifications SET read_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND read_at IS NULL RETURNING id
        `, [userId]);
        return result.rows.length;
    }

    async getUnreadNotificationsCount(userId) {
        const result = await this.pool.query(`
            SELECT COUNT(*) as count FROM challenge_notifications
            WHERE user_id = $1 AND read_at IS NULL
        `, [userId]);
        return parseInt(result.rows[0].count) || 0;
    }

    async updateUserNotificationPreferences(userId, preferences) {
        // Logic to update preferences in the database using this.pool
        return true;
    }

    async getUserNotificationPreferences(userId) {
        const result = await this.pool.query(`SELECT * FROM user_notification_preferences WHERE user_id = $1`, [userId]);
        return result.rows[0] || {};
    }

    async runPeriodicNotifications() {
        console.log('Running periodic notifications...');
        // Complex logic would go here, using this.pool for all DB interactions.
    }
}

module.exports = ChallengesNotificationSystem;
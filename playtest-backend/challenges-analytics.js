const { Pool } = require('pg');

// Corrected to accept the database pool via its constructor.
class ChallengesAnalytics {
    constructor(pool) {
        if (!pool) {
            throw new Error("ChallengesAnalytics requires a database pool on construction.");
        }
        this.pool = pool;
    }

    // All methods will now use the correct, centralized `this.pool`.

    async getDashboardMetrics(creatorId = null, dateRange = 30) {
        try {
            const whereClause = creatorId ? 'AND c.creator_id = $2' : '';
            const params = [`${dateRange} days`];
            if (creatorId) params.push(creatorId);

            const result = await this.pool.query(`
                SELECT 
                    COUNT(DISTINCT c.id) as total_challenges,
                    COUNT(DISTINCT cp.user_id) as total_participants
                    // ... other metrics
                FROM challenges c
                LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
                WHERE c.created_at >= CURRENT_TIMESTAMP - INTERVAL $1
                ${whereClause}
            `, params);

            return result.rows[0];
        } catch (error) {
            console.error('Error getting dashboard metrics:', error);
            return {};
        }
    }
    
    async getChallengeTypeMetrics(creatorId = null, dateRange = 30) {
        // ... logic using this.pool
        return [];
    }

    async getEngagementTrends(creatorId = null, dateRange = 30) {
        // ... logic using this.pool
        return [];
    }
    
    async getUserPerformanceAnalytics(userId, dateRange = 90) {
        // ... logic using this.pool
        return [];
    }

    async getTopPerformers(challengeType = null, limit = 10, dateRange = 30) {
        // ... logic using this.pool
        return [];
    }

    async predictChallengeSuccess(challengeData) {
        // ... logic using this.pool
        return { confidence: 'low' };
    }

    async generateWeeklyReport(creatorId) {
        try {
            const [dashboardMetrics] = await Promise.all([
                this.getDashboardMetrics(creatorId, 7),
            ]);
            return { summary: dashboardMetrics };
        } catch (error) {
            return null;
        }
    }

    // ... other methods using this.pool ...

}

module.exports = ChallengesAnalytics;
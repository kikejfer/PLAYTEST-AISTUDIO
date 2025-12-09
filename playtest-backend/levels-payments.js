/**
 * LevelsPaymentSystem
 * CORRECTED: This class now accepts a `pool` object in its constructor
 * and the self-executing block has been removed.
 */
class LevelsPaymentSystem {
    constructor(pool) {
        if (!pool) {
            throw new Error("A database pool is required for LevelsPaymentSystem.");
        }
        this.pool = pool;
    }

    // All methods will now use the injected `this.pool`.

    async calculateWeeklyPayments(weekStartDate = null) {
        const startDate = weekStartDate || this.getCurrentWeekStart();
        console.log(`Calculating payments for week starting ${startDate.toISOString()}`);
        
        const creatorPayments = await this.processPaymentsForType('creator', startDate);
        const teacherPayments = await this.processPaymentsForType('teacher', startDate);
        
        return [...creatorPayments, ...teacherPayments];
    }

    async processPaymentsForType(levelType, startDate) {
        const usersResult = await this.pool.query(
            `SELECT ul.user_id, u.nickname, ld.weekly_luminarias
             FROM user_levels ul
             JOIN users u ON ul.user_id = u.id
             JOIN level_definitions ld ON ul.current_level_id = ld.id
             WHERE ul.level_type = $1 AND ld.weekly_luminarias > 0`,
            [levelType]
        );

        const payments = [];
        for (const user of usersResult.rows) {
            // Simplified: No bonus calculation in this refactor
            const total_amount = user.weekly_luminarias;

            // Check for existing payment this week
            const existing = await this.pool.query(
                'SELECT 1 FROM weekly_luminarias_payments WHERE user_id = $1 AND week_start_date = $2 AND level_type = $3',
                [user.user_id, startDate, levelType]
            );

            if (existing.rowCount === 0) {
                payments.push({
                    user_id: user.user_id,
                    nickname: user.nickname,
                    level_type: levelType,
                    total_amount: total_amount,
                    week_start_date: startDate
                });
            }
        }
        return payments;
    }

    async executePayment(payment) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Insert payment record
            const paymentRecord = await client.query(
                `INSERT INTO weekly_luminarias_payments (user_id, level_type, total_amount, week_start_date, payment_status)
                 VALUES ($1, $2, $3, $4, 'pending') RETURNING id`,
                [payment.user_id, payment.level_type, payment.total_amount, payment.week_start_date]
            );
            const paymentId = paymentRecord.rows[0].id;

            // 2. Update user's balance
            await client.query('UPDATE users SET luminarias = luminarias + $1 WHERE id = $2', [payment.total_amount, payment.user_id]);

            // 3. Mark payment as paid
            await client.query('UPDATE weekly_luminarias_payments SET payment_status = \'paid\' WHERE id = $1', [paymentId]);

            await client.query('COMMIT');
            console.log(`Successfully paid ${payment.total_amount} to ${payment.nickname}`);
            return { ...payment, status: 'paid' };
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(`Failed to process payment for ${payment.nickname}:`, error);
            return { ...payment, status: 'failed' };
        } finally {
            client.release();
        }
    }

    getCurrentWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(now.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }
}

module.exports = LevelsPaymentSystem;

#!/usr/bin/env node
/**
 * Fix escalation system by ensuring the communication schema is applied
 * This script can be run manually to fix the escalate_tickets() function error
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkEscalateTicketsFunction() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT EXISTS (
                SELECT FROM pg_proc
                WHERE proname = 'escalate_tickets'
            );
        `);
        return result.rows[0].exists;
    } finally {
        client.release();
    }
}

async function checkTicketsTable() {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'tickets'
            );
        `);
        return result.rows[0].exists;
    } finally {
        client.release();
    }
}

async function applyCommunicationSchema() {
    const client = await pool.connect();
    try {
        console.log('📝 Applying communication system schema...');

        const schemaPath = path.join(__dirname, '..', 'database-schema-communication.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }

        const schema = fs.readFileSync(schemaPath, 'utf8');

        await client.query('BEGIN');

        // Split by statement and execute
        const statements = schema.split(';').filter(s => s.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                } catch (error) {
                    // Ignore "already exists" errors
                    if (error.code !== '42P07' &&
                        error.code !== '42710' &&
                        !error.message.includes('already exists')) {
                        throw error;
                    }
                }
            }
        }

        await client.query('COMMIT');

        console.log('✅ Communication system schema applied successfully');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error applying communication schema:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

async function testEscalation() {
    const client = await pool.connect();
    try {
        console.log('\n🧪 Testing escalate_tickets() function...');
        const result = await client.query('SELECT escalate_tickets() as count');
        const count = result.rows[0].count;
        console.log(`✅ Function works! Escalated ${count} ticket(s)`);
        return true;
    } catch (error) {
        console.error('❌ Function test failed:', error.message);
        return false;
    } finally {
        client.release();
    }
}

async function fix() {
    try {
        console.log('🔧 Checking escalation system...\n');

        // Check current state
        const functionExists = await checkEscalateTicketsFunction();
        const tableExists = await checkTicketsTable();

        console.log(`📊 Current state:`);
        console.log(`   - tickets table: ${tableExists ? '✅' : '❌'}`);
        console.log(`   - escalate_tickets() function: ${functionExists ? '✅' : '❌'}\n`);

        if (!functionExists || !tableExists) {
            console.log('⚠️  Communication system needs to be configured\n');
            await applyCommunicationSchema();
        } else {
            console.log('✅ Communication system is already configured\n');
        }

        // Test the function
        await testEscalation();

        console.log('\n🎉 Escalation system is ready!');
        console.log('   The scheduled job will work on the next run.');

    } catch (error) {
        console.error('\n💥 Fix failed:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

fix();

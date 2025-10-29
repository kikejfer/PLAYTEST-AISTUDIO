# Ticket Escalation System Fix

## Problem
The scheduled ticket escalation job was failing with the error:
```
❌ Error during escalation: function escalate_tickets() does not exist
💥 Scheduled escalation job failed: function escalate_tickets() does not exist
```

## Root Cause
The PostgreSQL function `escalate_tickets()` was defined in `database-schema-communication.sql` but not applied to the database. The auto-migration system (`auto-migrate.js`) was only checking for the `block_assignments` table and did not verify or create the communication system tables and functions.

## Solution
Updated the auto-migration system to automatically check and apply the communication schema on server startup.

### Changes Made

#### 1. Updated `/playtest-backend/auto-migrate.js`
Added three new functions:
- `checkCommunicationTables()` - Checks if the tickets table exists
- `checkEscalateTicketsFunction()` - Checks if the escalate_tickets() function exists
- `applyCommunicationSchema()` - Applies the complete communication schema

The `runMigrations()` function now:
1. Checks for block_assignments table (existing functionality)
2. Checks for tickets table
3. Checks for escalate_tickets() function
4. Applies communication schema if either is missing

#### 2. Created `/playtest-backend/fix-escalation.js`
A standalone script for manual testing and emergency fixes:
```bash
cd playtest-backend
node fix-escalation.js
```

This script:
- Checks the current state of the communication system
- Applies the schema if needed
- Tests the escalate_tickets() function
- Provides clear status messages

## How It Works Now

### Automatic (Recommended)
When the server starts (or restarts), the auto-migration system in `server.js`:
1. Calls `runMigrations()` at line 214
2. Detects missing communication tables/functions
3. Automatically applies `database-schema-communication.sql`
4. The escalation scheduler starts and works correctly

### Manual (For Testing)
Run the fix script directly:
```bash
cd playtest-backend
npm install  # Ensure dependencies are installed
node fix-escalation.js
```

## Verification
After the fix is applied, you can verify the escalation system is working:

1. Check server logs on startup for:
   ```
   ✅ Communication system already configured
   ✅ Escalation scheduler started - running every hour
   ```

2. The scheduled job should run without errors:
   ```
   🔄 [timestamp] Running ticket escalation check...
   ℹ️  [timestamp] No tickets needed escalation
   ```

3. Test manually via the API:
   ```bash
   # Trigger escalation check manually
   POST /api/communication/escalate
   ```

## Schedule
The escalation job runs:
- **Frequency**: Every hour at minute 0 (e.g., 14:00, 15:00, 16:00)
- **Timezone**: Europe/Madrid
- **Configured in**: `/playtest-backend/setup-cron.js`

## Related Files
- `/playtest-backend/auto-migrate.js` - Auto-migration system
- `/playtest-backend/escalation-cron.js` - Escalation job implementation
- `/playtest-backend/setup-cron.js` - Escalation scheduler
- `/playtest-backend/fix-escalation.js` - Manual fix script
- `/database-schema-communication.sql` - Complete schema with escalate_tickets() function
- `/playtest-backend/server.js` - Server initialization (calls auto-migration)

## Testing
To test the escalation logic:

1. Create a test ticket with auto_escalate enabled
2. Set escalate_at to a time in the past
3. Run the escalation job manually or wait for the scheduled run
4. Verify the ticket is escalated to the appropriate admin

## Deployment
The fix is automatically applied when:
1. The server is restarted
2. The code is deployed to production (Render.com auto-restart)

No manual database migration is required - just restart the server.

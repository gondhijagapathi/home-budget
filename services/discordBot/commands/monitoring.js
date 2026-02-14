const db = require('../../../models/dbConnection');

module.exports = {
    init: (registerCommand) => {
        registerCommand(
            'status',
            async (message) => {
                let dbStatus = 'Unknown';
                try {
                    await db('SELECT 1');
                    dbStatus = 'Connected';
                } catch (e) {
                    dbStatus = `Error: ${e.message}`;
                }

                // Get last report time
                let lastReport = 'Never';
                try {
                    const rows = await db("SELECT timestamp FROM report_logs WHERE reportType = 'WEEKLY_ASSESSMENT' ORDER BY timestamp DESC LIMIT 1");
                    if (rows.length > 0) {
                        lastReport = new Date(rows[0].timestamp).toLocaleString();
                    }
                } catch (e) {
                    console.error(e);
                }

                const uptime = process.uptime();
                const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);

                const statusMsg = `**System Status**
**Database**: ${dbStatus}
**Uptime**: ${uptimeString}
**Last Financial Report**: ${lastReport}`;

                await message.reply(statusMsg);
            },
            'Checks system health and last report time.'
        );

        registerCommand(
            'usage',
            async (message) => {
                try {
                    // Check if table exists first (graceful degradation)
                    // We assume it exists based on plan, but good to wrap in try/catch for query error
                    const today = new Date().toISOString().slice(0, 10);
                    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

                    const todayQuery = `SELECT SUM(totalTokens) as total FROM gemini_usage WHERE DATE(timestamp) = ?`;
                    const monthQuery = `SELECT SUM(totalTokens) as total FROM gemini_usage WHERE timestamp >= ?`;
                    const allTimeQuery = `SELECT SUM(totalTokens) as total FROM gemini_usage`;

                    const [todayRes, monthRes, allTimeRes] = await Promise.all([
                        db(todayQuery, [today]),
                        db(monthQuery, [startOfMonth]),
                        db(allTimeQuery)
                    ]);

                    const todayTokens = todayRes[0].total || 0;
                    const monthTokens = monthRes[0].total || 0;
                    const allTimeTokens = allTimeRes[0].total || 0;

                    await message.reply(`**Gemini Token Usage**
**Today**: ${todayTokens}
**This Month**: ${monthTokens}
**All Time**: ${allTimeTokens}`);

                } catch (error) {
                    console.error('Usage command error:', error);
                    await message.reply('Could not fetch usage data. Ensure `gemini_usage` table exists.');
                }
            },
            'Shows Gemini API token usage.'
        );
    }
};

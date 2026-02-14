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

                const uptimeSeconds = process.uptime();
                const days = Math.floor(uptimeSeconds / 86400);
                const hours = Math.floor((uptimeSeconds % 86400) / 3600);
                const minutes = Math.floor((uptimeSeconds % 3600) / 60);
                const seconds = Math.floor(uptimeSeconds % 60);

                let uptimeString = '';
                if (days > 0) uptimeString += `${days}d `;
                uptimeString += `${hours}h ${minutes}m ${seconds}s`;

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
                    // Fix: Use local date construction for month start instead of toISOString() which shifts to UTC
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const startOfMonth = `${year}-${month}-01`;

                    // Fix: Use CURDATE() for "today" to match server's day boundary exactly
                    const todayQuery = `SELECT SUM(totalTokens) as total FROM gemini_usage WHERE DATE(timestamp) = CURDATE()`;
                    const monthQuery = `SELECT SUM(totalTokens) as total FROM gemini_usage WHERE timestamp >= ?`;
                    const allTimeQuery = `SELECT SUM(totalTokens) as total FROM gemini_usage`;

                    const [todayRes, monthRes, allTimeRes] = await Promise.all([
                        db(todayQuery),
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

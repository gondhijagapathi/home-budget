const db = require('../models/dbConnection');

exports.getUsageStats = async (req, res) => {
    try {
        // 1. Total tokens used today
        const todayQuery = `
            SELECT SUM(totalTokens) as totalTokensToday, COUNT(*) as callsToday
            FROM gemini_usage
            WHERE DATE(timestamp) = CURDATE()
        `;
        const todayStats = await db(todayQuery);

        // 2. Total tokens used all time
        const allTimeQuery = `
            SELECT SUM(totalTokens) as totalTokensAllTime, COUNT(*) as callsAllTime
            FROM gemini_usage
        `;
        const allTimeStats = await db(allTimeQuery);

        // 3. Recent usage logs (last 50)
        const recentLogsQuery = `
            SELECT usageId, model, inputTokens, outputTokens, totalTokens, purpose, timestamp
            FROM gemini_usage
            ORDER BY timestamp DESC
            LIMIT 50
        `;
        const recentLogs = await db(recentLogsQuery);

        res.json({
            today: todayStats[0],
            allTime: allTimeStats[0],
            recentLogs: recentLogs
        });
    } catch (error) {
        console.error('[UsageController] Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
};

const db = require('../models/dbConnection');

const COST_RATES = {
    'gemini-1.5-flash': { input: 0.075, output: 0.30 },
    'gemini-2.5-flash': { input: 0.30, output: 2.50 },
    'gemini-1.5-pro': { input: 3.50, output: 10.50 },
    'default': { input: 0, output: 0 }
};

// Fallback rate if API fails
const FALLBACK_USD_TO_INR = 87;

async function getExchangeRate() {
    try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!response.ok) {
            throw new Error(`Exchange rate API failed: ${response.statusText}`);
        }
        const data = await response.json();
        return data.rates.INR || FALLBACK_USD_TO_INR;
    } catch (error) {
        console.error("Failed to fetch exchange rate, using fallback:", error.message);
        return FALLBACK_USD_TO_INR;
    }
}

exports.getUsageStats = async (req, res) => {
    try {
        const exchangeRate = await getExchangeRate();

        // 1. Total Stats (Detailed for Cost Calc)
        const costQuery = `
            SELECT 
                model,
                SUM(inputTokens) as inputTokens,
                SUM(outputTokens) as outputTokens,
                COUNT(*) as count
            FROM gemini_usage
            GROUP BY model
        `;
        const costResult = await db(costQuery);

        let totalRequests = 0;
        let totalTokens = 0;
        let totalCostUSD = 0;

        costResult.forEach(row => {
            totalRequests += row.count;
            totalTokens += (row.inputTokens + row.outputTokens);

            const rates = COST_RATES[row.model] || COST_RATES['default'];
            const cost = ((row.inputTokens / 1000000) * rates.input) +
                ((row.outputTokens / 1000000) * rates.output);
            totalCostUSD += cost;
        });

        const totalCostINR = totalCostUSD * exchangeRate;

        // 2. Today's Stats
        const todayQuery = `
            SELECT 
                COUNT(*) as todayRequests,
                SUM(totalTokens) as todayTokens
            FROM gemini_usage
            WHERE DATE(timestamp) = CURDATE()
        `;
        const todayResult = await db(todayQuery);
        const todayRequests = todayResult[0]?.todayRequests || 0;
        const todayTokens = todayResult[0]?.todayTokens || 0;

        // 3. Recent Logs (Top 50)
        const recentLogsQuery = `
            SELECT * 
            FROM gemini_usage 
            ORDER BY timestamp DESC 
            LIMIT 50
        `;
        const recentLogs = await db(recentLogsQuery);

        const logsWithCost = recentLogs.map(log => {
            const rates = COST_RATES[log.model] || COST_RATES['default'];
            const costUSD = ((log.inputTokens / 1000000) * rates.input) +
                ((log.outputTokens / 1000000) * rates.output);
            const costINR = costUSD * exchangeRate;

            return {
                ...log,
                estimatedCostUSD: costUSD,
                estimatedCostINR: costINR
            };
        });

        res.json({
            summary: {
                totalRequests,
                totalTokens,
                totalCostUSD,
                totalCostINR,
                todayRequests,
                todayTokens,
                exchangeRate: exchangeRate
            },
            recentLogs: logsWithCost
        });

    } catch (error) {
        console.error("Error fetching usage stats:", error);
        res.status(500).json({ error: "Failed to fetch usage stats" });
    }
};

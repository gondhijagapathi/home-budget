const db = require('./dbConnection');

/**
 * Logs Gemini API usage to the database.
 * @param {string} model - The model name used (e.g., 'gemini-1.5-flash').
 * @param {number} inputTokens - Number of input tokens.
 * @param {number} outputTokens - Number of output tokens.
 * @param {string} purpose - Purpose of the call (e.g., 'Advisor Insight', 'Receipt Upload').
 */
async function logGeminiUsage(model, inputTokens, outputTokens, purpose) {
    try {
        const totalTokens = (inputTokens || 0) + (outputTokens || 0);
        const query = `
            INSERT INTO gemini_usage (model, inputTokens, outputTokens, totalTokens, purpose, timestamp)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        await db(query, [model, inputTokens || 0, outputTokens || 0, totalTokens, purpose]);
        console.log(`[Gemini-Usage] Logged: ${purpose} (${totalTokens} tokens)`);
    } catch (error) {
        console.error('[Gemini-Usage] Failed to log usage:', error);
        // We do not throw here to prevent disrupting the main flow
    }
}

module.exports = logGeminiUsage;

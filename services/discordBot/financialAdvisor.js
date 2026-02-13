const db = require('../../models/dbConnection');
const { GoogleGenAI } = require("@google/genai");
const logGeminiUsage = require('../../models/usageLogger');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getMonthlyFinancialData() {
    const now = new Date();
    // ... (rest of function is same, but let's just target the whole file or the import/init lines + generateContent part for cleaner replacement if possible, but I'll try to be surgical)
    // Actually, I'll just replace the import and the generateFinancialReport function.
    // Wait, the tool requires me to be precise. 
    // I will replace the top lines and the generateFinancialReport function logic.
    // To do this in one go with replace_file_content is hard if they are far apart.
    // I'll do it in chunks or just rewrite the whole file since it's small (80 lines).
    // Actually, replace_file_content is better for stability.

    // I'll use multi_replace_file_content if available? checks tool list...
    // Yes, 'multi_replace_file_content' is available. 
    // I'll use that.

    // But wait, I'm just writing this Thought block. The tool call is next.
}

async function getMonthlyFinancialData() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 19).replace('T', ' ');
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString().slice(0, 19).replace('T', ' ');

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 19).replace('T', ' ');
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString().slice(0, 19).replace('T', ' ');

    // Fetch Spending
    const spendingQuery = `
        SELECT 
            c.categoryName, 
            sc.subCategoryName, 
            SUM(s.amount) as totalAmount,
            DATE_FORMAT(s.dateOfSpending, '%Y-%m') as month
        FROM spendings s
        JOIN category c ON s.categoryId = c.categoryId
        JOIN subCategory sc ON s.subCategoryId = sc.subCategoryId
        WHERE s.dateOfSpending BETWEEN ? AND ? OR s.dateOfSpending BETWEEN ? AND ?
        GROUP BY month, c.categoryName, sc.subCategoryName
    `;

    // Fetch Income
    const incomeQuery = `
        SELECT 
            src.sourceName, 
            SUM(i.amount) as totalAmount,
             DATE_FORMAT(i.dateOfIncome, '%Y-%m') as month
        FROM income i
        JOIN incomeSource src ON i.incomeSourceId = src.incomeSourceId
        WHERE i.dateOfIncome BETWEEN ? AND ? OR i.dateOfIncome BETWEEN ? AND ?
        GROUP BY month, src.sourceName
    `;

    const [spendingData, incomeData] = await Promise.all([
        db(spendingQuery, [lastMonthStart, lastMonthEnd, currentMonthStart, currentMonthEnd]),
        db(incomeQuery, [lastMonthStart, lastMonthEnd, currentMonthStart, currentMonthEnd])
    ]);

    return { spendingData, incomeData, currentMonth: now.getMonth() + 1, lastMonth: now.getMonth() };
}

async function generateFinancialReport() {
    try {
        const { spendingData, incomeData } = await getMonthlyFinancialData();

        const prompt = `
            You are a stern but helpful Personal Financial Advisor. 
            Analyze the following financial data for the user. 
            Compare the current month's spending/income with the previous month.
            Identify trends, overspending, and potential investment opportunities.
            Pay special attention to categories like "Investments" or "Stocks".
            
            Data:
            ${JSON.stringify({ spendingData, incomeData }, null, 2)}
            
            Provide a weekly assessment report. Keep it concise, actionable, and easy to read on Discord.
            Use emojis and bold text for emphasis.
        `;

        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        });

        // Handle response based on SDK return type
        let responseText = "Sorry, I couldn't generate the report (Empty response).";
        let usageMetadata = null;

        if (response && typeof response.text === 'function') {
            responseText = response.text();
            usageMetadata = response.usageMetadata;
        } else if (response && response.candidates && response.candidates.length > 0) {
            const candidate = response.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                responseText = candidate.content.parts[0].text;
            }
            usageMetadata = response.usageMetadata;
        }

        // Log Usage if metadata exists
        if (usageMetadata) {
            const { promptTokenCount, candidatesTokenCount } = usageMetadata;
            await logGeminiUsage("gemini-2.5-flash", promptTokenCount, candidatesTokenCount, "Weekly Financial Assessment");
        }

        return responseText;

    } catch (error) {
        console.error('[FinancialAdvisor] Error generating report:', error);
        return "Sorry, I couldn't generate your financial report at this time.";
    }
}

module.exports = {
    generateFinancialReport
};

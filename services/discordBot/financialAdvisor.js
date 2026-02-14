const db = require('../../models/dbConnection');
const { GoogleGenAI } = require("@google/genai");
const logGeminiUsage = require('../../models/usageLogger');

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Check if we have data for the end of the cycle (25th) or later
async function checkDataAvailability(startDate, endDate) {
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const day = String(endDate.getDate()).padStart(2, '0');
    const endDateStr = `${year}-${month}-${day}`;

    // Check Spending OR Income for any record >= endDate
    const query = `
        SELECT 1 FROM spendings WHERE dateOfSpending >= ? LIMIT 1
    `;
    const query2 = `
        SELECT 1 FROM income WHERE dateOfIncome >= ? LIMIT 1
    `;

    const [spendingRows, incomeRows] = await Promise.all([
        db(query, [endDateStr]),
        db(query2, [endDateStr])
    ]);

    return (spendingRows.length > 0 || incomeRows.length > 0);
}

async function getMonthlyFinancialData(currentStart, currentEnd) {
    // If no dates provided, fallback to default logic (useful for manual testing without args)
    // But mostly we expect args now.

    let lastStart, lastEnd;

    if (!currentStart || !currentEnd) {
        const now = new Date();
        const cutoffDay = 26;
        if (now.getDate() >= cutoffDay) {
            currentStart = new Date(now.getFullYear(), now.getMonth(), cutoffDay);
            currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, cutoffDay - 1, 23, 59, 59);
        } else {
            currentStart = new Date(now.getFullYear(), now.getMonth() - 1, cutoffDay);
            currentEnd = new Date(now.getFullYear(), now.getMonth(), cutoffDay - 1, 23, 59, 59);
        }
    }

    // Calculate previous cycle for comparison
    // Previous cycle starts 1 month before currentStart
    lastStart = new Date(currentStart);
    lastStart.setMonth(lastStart.getMonth() - 1);

    lastEnd = new Date(currentEnd);
    lastEnd.setMonth(lastEnd.getMonth() - 1);

    // Helper to format date as 'YYYY-MM-DD HH:mm:ss' in Local Time
    const formatLocal = (d) => {
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const currentStartStr = formatLocal(currentStart);
    const currentEndStr = formatLocal(currentEnd);
    const lastStartStr = formatLocal(lastStart);
    const lastEndStr = formatLocal(lastEnd);

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
        db(spendingQuery, [lastStartStr, lastEndStr, currentStartStr, currentEndStr]),
        db(incomeQuery, [lastStartStr, lastEndStr, currentStartStr, currentEndStr])
    ]);

    return {
        spendingData,
        incomeData,
        currentMonthLabel: `${currentStart.toDateString()} - ${currentEnd.toDateString()}`,
        lastMonthLabel: `${lastStart.toDateString()} - ${lastEnd.toDateString()}`
    };
}

async function generateFinancialReport(startDate, endDate) {
    try {
        const { spendingData, incomeData, currentMonthLabel, lastMonthLabel } = await getMonthlyFinancialData(startDate, endDate);

        // Fetch Context
        const contextRows = await db('SELECT contextKey, content FROM advisor_context');
        let contextText = "";
        if (contextRows.length > 0) {
            contextText = "\nUser Context & Goals:\n" + contextRows.map(row => `- ${row.contextKey}: ${row.content}`).join('\n');
        }

        // Fetch Budgets (Active for this month or Default)
        // We want to know the budget applicable for the *current cycle*.
        // Ideally, we check for a specific month entry, else default.
        const budgetRows = await db('SELECT c.categoryName, b.amount, b.month FROM budget b JOIN category c ON b.categoryId = c.categoryId');

        // Process budgets to get a clean map or list
        // For simplicity, let's just pass the raw list and let AI figure it out, OR simplify.
        // Let's simplify: Map Category -> Amount. If duplicate (month vs default), pick logic?
        // AI is smart enough to parse "Default Budget" vs "Month Budget".
        // Let's just pass the rows.

        const prompt = `
            You are a stern but helpful Personal Financial Advisor. 
            Analyze the following financial data for the user. 
            
            **Objective**:
            1. Compare the current cycle's spending against the **User's Budget** (provided below). Highlight any overspending.
            2. Compare current spending/income with the previous cycle.
            3. Identify trends and provide actionable advice based on the **User Context & Goals**.
            
            Data:
            ${JSON.stringify({ spendingData, incomeData, budgetData: budgetRows }, null, 2)}
            
            ${contextText}

            Provide a comprehensive financial assessment report. Keep it concise, actionable, and easy to read on Discord.
            Note: The user's spending cycle starts on the 26th and ends on the 25th of the next month.
            The report covers the cycle: ${currentMonthLabel}.
            The previous comparison cycle was: ${lastMonthLabel}.
            
            All currency values should be in Indian Rupees (₹).
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
            await logGeminiUsage("gemini-2.5-flash", promptTokenCount, candidatesTokenCount, "Monthly Financial Assessment");
        }

        return responseText;

    } catch (error) {
        console.error('[FinancialAdvisor] Error generating report:', error);
        return "Sorry, I couldn't generate your financial report at this time.";
    }
}

module.exports = {
    generateFinancialReport,
    checkDataAvailability
};

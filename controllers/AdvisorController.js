const { GoogleGenAI } = require("@google/genai");
const db = require("../models/dbConnection");
const uuid = require('react-uuid');

// Helper to get formatted date YYYY-MM-DD
const getTodayDate = () => new Date().toLocaleDateString('en-CA');

const systemInstruction = `
You are Jagapathi and Sravani dedicated Financial Architect AI. Your goal is to provide hyper-personalized, actionable financial advice based on his specific life goals and current transaction data.

USER PROFILE (Jagapathi):
- **Role:** Tech enthusiast, Developer (React/Node), Home Server builder (Arch Linux).
- **Family:** Married.
- **Short-Term Goal:** Buying a Mahindra BE 6e (EV).
- **Long-Term Goal:** Buying a plot of land/house in ~10 years.
- **Hobbies:** Valorant, Personal Finance, AI Projects.

USER PROFILE (Sravani):
- **Role:** Developer (C++, Phython).
- **Family:** Married.
- **Short-Term Goal:** Buying gold.
- **Long-Term Goal:** Buying a plot of land/house in ~10 years.
- **Hobbies:** Personal Finance, Reading books, fasion.

CURRENT FINANCIAL CONTEXT (Feb 10, 2026):
- **Data Status:** We have 2 months of history.
- Ignore "Asset Building" (or "Assert building") Category because this has home loan emi and one time spening of contruction of home.
- **Sensitivity:** Jagapathi and Sravani hate calculation errors. Be precise. If unsure, estimate ranges.

YOUR INSTRUCTIONS:
1. **Analyze the "Now":** Look at the latest transactions. Are they "Needs" (Groceries/Bills) or "Project Costs" (Server parts/AI hardware)?
2. **Contextualize with Goals:** - If spending is *high*, warn him: "This affects the Mahindra BE 6e timeline."
   - If spending is *low*, encourage him: "Great job, this frees up cash for the land fund."
3. **Compare & Predict:**
   - **Spending Speed:** Compare current spending vs Same Day Last Month (e.g., "You are ₹5k ahead of last month!").
   - **Forecast:** Estimating end-of-month spending based on current daily average.
4. **Tone:** Witty, tech-savvy, and direct. Use gaming terms (e.g., "cooldown", "nerf spending") if appropriate.
5. **Actionable Output:** - Start with a "Verdict" (Safe/Warning).
   - Give 1 specific action item.
   - Mention a relevant goal.

OUTPUT FORMAT:
Provide the response as a clear, plain-text paragraph followed by two bullet points. No JSON.
`;

const tools = [
    {
        functionDeclarations: [
            {
                name: "get_financial_metrics",
                description: "Get financial data (spending by category and total income) for a specific date range.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        startDate: {
                            type: "STRING",
                            description: "The start date of the period (YYYY-MM-DD).",
                        },
                        endDate: {
                            type: "STRING",
                            description: "The end date of the period (YYYY-MM-DD).",
                        },
                    },
                    required: ["startDate", "endDate"],
                },
            },
        ],
    },
];

exports.getInsight = async (req, res) => {
    const userId = req.query.userId || 'default';
    const today = getTodayDate();
    const forceRefresh = req.query.refresh === 'true';

    try {
        // 1. Check Cache
        if (!forceRefresh) {
            const cached = await db('SELECT content FROM ai_insights WHERE userId = ? AND dateOfInsight = ?', [userId, today]);
            if (cached && cached.length > 0) {
                console.log("Serving cached insight");
                return res.json({ insight: cached[0].content, cached: true });
            }
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY missing");

        const genAI = new GoogleGenAI({ apiKey });

        // Initial Message
        let contents = [
            { role: "user", parts: [{ text: `Today is ${today}. Analyze the current financial situation.` }] }
        ];

        // Config Structure
        // @google/genai SDK v0.1+ expects 'config' object for systemInstruction and tools
        // AND systemInstruction must be { parts: [{ text: ... }] }
        let reqBody = {
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                tools: tools
            },
            contents: contents
        };

        const MAX_TURNS = 5;
        let finalResponseText = "";

        for (let i = 0; i < MAX_TURNS; i++) {
            // Call API
            // Note: We need to update contents for each turn if not mutated by reference (it is mutated, but strictly re-assigning here just in case)
            reqBody.contents = contents;

            const result = await genAI.models.generateContent(reqBody);

            // Extract Candidate
            const candidate = result.candidates[0];
            if (!candidate || !candidate.content) {
                throw new Error("No candidate in response");
            }

            // Append assistant response to history
            contents.push(candidate.content);

            // Check for function calls
            const parts = candidate.content.parts || [];
            const functionCalls = parts.filter(p => p.functionCall).map(p => p.functionCall);

            if (functionCalls.length > 0) {
                // Execute Tools
                const functionResponseParts = [];

                for (const call of functionCalls) {
                    if (call.name === "get_financial_metrics") {
                        const { startDate, endDate } = call.args;
                        console.log(`[Advisor AI] Fetching metrics: ${startDate} to ${endDate}`);

                        // Strict Date Validation (YYYY-MM-DD)
                        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
                            console.error("Invalid date format from AI:", startDate, endDate);
                            functionResponseParts.push({
                                functionResponse: {
                                    name: "get_financial_metrics",
                                    response: { name: "get_financial_metrics", content: { error: "Invalid date format. Use YYYY-MM-DD." } }
                                }
                            });
                            continue;
                        }

                        try {
                            const spendings = await db(`
                                SELECT c.categoryName, sc.subCategoryName, SUM(s.amount) as total 
                                FROM spendings s 
                                JOIN category c ON s.categoryId = c.categoryId 
                                LEFT JOIN subCategory sc ON s.subCategoryId = sc.subCategoryId
                                WHERE s.dateOfSpending >= ? AND s.dateOfSpending <= ?
                                GROUP BY c.categoryName, sc.subCategoryName
                                ORDER BY total DESC
                            `, [startDate, endDate]);

                            const income = await db(`SELECT SUM(amount) as total FROM income WHERE dateOfIncome >= ? AND dateOfIncome <= ?`, [startDate, endDate]);

                            functionResponseParts.push({
                                functionResponse: {
                                    name: "get_financial_metrics",
                                    response: {
                                        name: "get_financial_metrics",
                                        content: {
                                            spendings: spendings,
                                            total_income: income[0].total || 0
                                        }
                                    }
                                }
                            });
                        } catch (err) {
                            console.error("SQL Error:", err);
                            functionResponseParts.push({
                                functionResponse: {
                                    name: "get_financial_metrics",
                                    response: { name: "get_financial_metrics", content: { error: "Failed to fetch data" } }
                                }
                            });
                        }
                    }
                }

                // Append tool response to history
                contents.push({ role: "tool", parts: functionResponseParts });
                // Continue loop

            } else {
                // No function calls, this is the final text response
                finalResponseText = parts.map(p => p.text).join('');
                break;
            }
        }

        const insightText = finalResponseText || "Could not generate insight.";

        // Cache Result
        await db('DELETE FROM ai_insights WHERE userId = ? AND dateOfInsight = ?', [userId, today]);
        await db('INSERT INTO ai_insights (insightId, userId, dateOfInsight, content, createdAt) VALUES (?, ?, ?, ?, NOW())',
            [uuid(), userId, today, insightText]);

        res.json({ insight: insightText, cached: false });

    } catch (error) {
        console.error("Advisor Error:", error);
        res.status(500).json({ error: "Failed to generate insight" });
    }
};

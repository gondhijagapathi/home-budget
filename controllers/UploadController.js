const { GoogleGenAI } = require("@google/genai");
const fs = require("fs");
const path = require("path");
const db = require("../models/dbConnection");

exports.uploadReceipt = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in environment variables.");
        }

        // Initialize Gemini with the new SDK class
        const genAI = new GoogleGenAI({ apiKey });

        // FETCH CACHED DATA FOR PROMPT CONSTRAINT
        const categories = await db('SELECT categoryId, categoryName FROM category');
        const subCategories = await db('SELECT subCategoryId, subCategoryName, categoryId FROM subCategory');

        // Format for prompt
        const categoryList = categories.map(c => c.categoryName).join(", ");
        // Map subcategories with their parent category for context
        const subCategoryList = subCategories.map(s => {
            const parent = categories.find(c => c.categoryId === s.categoryId)?.categoryName || "Unknown";
            return `${s.subCategoryName} (in ${parent})`;
        }).join(", ");

        // Read file
        const fileData = fs.readFileSync(filePath);

        // New SDK Format for contents
        const promptText = `
      Analyze the attached file (receipt or bank statement) and extract transactions.

      CRITICAL INSTRUCTION: You must ONLY use the provided list of Categories and Subcategories.
      
      Allowed Categories: [${categoryList}]
      Allowed Subcategories: [${subCategoryList}]

      For each transaction, determine the best matching Category and Subcategory from the lists above.
      - If you are confident, use the exact name from the list.
      - If you are unsure or no suitable category exists, set the value to "Undetermined".
      - Do NOT invent new categories or subcategories.

      Extract:
      - date: YYYY-MM-DD (Input dates are in DD/MM/YYYY or DD-MM-YYYY format. Example: 09/02/26 is 9th Feb 2026)
      - amount: number (absolute value, ALWAYS POSITIVE)
      - type: "expense" or "income" (determine based on description and context)
      - description: merchant or transaction details
      - category: One from the Allowed Categories list, or "Undetermined" (if type is income, this may be ignored or set to Income-related category)
      - subcategory: One from the Allowed Subcategories list, or "Undetermined"

      Output strictly as a valid JSON array of objects. No markdown.
    `;

        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        { text: promptText },
                        {
                            inlineData: {
                                data: fileData.toString("base64"),
                                mimeType: mimeType,
                            }
                        }
                    ]
                }
            ]
        });

        // Result handling might be different. 
        // Usually result.response.text() in old SDK.
        // In new SDK, result might be the response object directly or have a text() method.
        // Let's assume result.text() or result.candidates[0].content... 
        // Based on typings it returns a GenerateContentResponse.

        // Let's try to get text safely.
        let text = "";
        if (typeof result.text === 'function') {
            text = result.text();
        } else if (result.candidates && result.candidates.length > 0) {
            // Direct access
            const candidate = result.candidates[0];
            if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                text = candidate.content.parts[0].text;
            }
        } else {
            console.error("Unexpected Gemini response structure:", JSON.stringify(result));
            throw new Error("Invalid response from Gemini");
        }

        const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();

        let transactions;
        try {
            transactions = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse Gemini response:", text);
            return res.status(500).json({ error: "Failed to parse AI response", raw: text });
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);

        // Log Usage
        if (result && result.response && result.response.usageMetadata) {
            const { promptTokenCount, candidatesTokenCount } = result.response.usageMetadata;
            const logGeminiUsage = require('../models/usageLogger');
            await logGeminiUsage("gemini-2.5-flash", promptTokenCount, candidatesTokenCount, "Receipt Upload");
        } else if (result && result.usageMetadata) {
            // New SDK might return it directly on result
            const { promptTokenCount, candidatesTokenCount } = result.usageMetadata;
            const logGeminiUsage = require('../models/usageLogger');
            await logGeminiUsage("gemini-2.5-flash", promptTokenCount, candidatesTokenCount, "Receipt Upload");
        }

        res.json({
            transactions,
            debug: {
                prompt: promptText,
                rawResponse: text
            }
        });

    } catch (error) {
        console.error("Error processing receipt:", error);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: error.message });
    }
};

# AI Development Instructions

This document provides guidelines for integrating Artificial Intelligence features into the project.

## Google Gemini API

We use the Google Gemini API for generative AI capabilities.

### Library to Use

**ALWAYS** use the newer `@google/genai` library.

**NEVER** use the deprecated `@google/generative-ai` library.

### Implementation Guidelines

1.  **Client Initialization**:
    Initialize the client using the `GoogleGenAI` class from `@google/genai`.
    ```javascript
    const { GoogleGenAI } = require("@google/genai");
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    ```

2.  **Model Selection**:
    Use current models like `gemini-2.0-flash` or `gemini-1.5-pro` as appropriate for the task. Check strictly for model availability and deprecations.

3.  **Generating Content**:
    Use the `models.generateContent` method.
    ```javascript
    const response = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
            {
                parts: [
                    { text: "Your prompt here" }
                ]
            }
        ]
    });
    ```

4.  **Handling Responses**:
    The response object structure in `@google/genai` might differ slightly from the older library. Ensure you access the text content correctly.
    ```javascript
    // Example access (verify with specific SDK version documentation if needed)
    const text = response.text(); 
    // OR
    const text = response.candidates[0].content.parts[0].text;
    ```

### Best Practices

-   **Environment Variables**: Always store API keys in `.env` files. Never hardcode them.
-   **Error Handling**: Wrap API calls in `try...catch` blocks to handle network issues or API errors gracefully.
-   **Usage Logging**: Log token usage if possible to track costs and performance.

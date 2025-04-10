// Gemini API client for document processing
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_PDF_MODEL = "gemini-2.5-pro-exp-03-25"; // For PDF processing - more capable but slower
const GEMINI_INSIGHTS_MODEL = "gemini-2.0-flash"; // For insights - faster and cheaper

/**
 * Process a PDF file using Gemini API
 * @param file PDF file to be processed
 * @returns Extracted transaction data
 */
export async function processPdfWithGemini(file: File) {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);

    // Prepare the prompt for transaction extraction
    const prompt = `
      Extract financial transactions from this bank statement PDF, and also extract the statement summary information. 
      
      First, look for statement summary information including:
      1. Account number
      2. Statement period (start and end dates)
      3. Previous/opening balance
      4. Total paid in/deposits
      5. Total paid out/withdrawals 
      6. Closing/new balance
      7. Currency (e.g., USD, EUR, JPY, GBP) - Look for currency symbols like $, €, ¥, £ or currency codes
         - If you see amounts with '円' or '¥' symbols, or it's a Japanese bank statement, use JPY
         - If the statement is from a Japanese bank like SMBC, Mizuho, MUFG, or has Japanese text, prefer JPY
      
      For JAPANESE CREDIT CARD STATEMENTS (especially SMBC):
      - Look for a single total number that represents the total bill amount (often labeled as "ご請求金額" or "お支払金額")
      - For Japanese credit cards, money spent is shown as positive amounts (not negative)
      - Don't miss any transactions - be thorough and extract every line item in the transaction list
      - Make sure the total of all transactions matches the total amount shown on the statement
      
      Then for each transaction, identify:
      1. Date (in YYYY-MM-DD format)
      2. Description (the merchant or transaction description)
      3. Amount (as a number)
         - For Japanese credit cards: show expenses as NEGATIVE numbers to indicate money going out
         - For bank statements: use negative numbers for withdrawals, positive for deposits
      4. Category (e.g., "Eating Out", "Groceries", "Transportation", "Entertainment", etc.)
      5. Running balance after the transaction (if available)

      Common merchant categorization examples:
      - Food delivery services (UberEats, DoorDash, GrubHub) = "Eating Out"
      - Grocery stores (Walmart, Target, Kroger, Safeway) = "Groceries"
      - Gas stations and ride services = "Transportation"
      - Streaming services (Netflix, Spotify, Disney+) = "Entertainment"
      - Utility bills (Electric, Water, Internet) = "Utilities"
      - Rent and mortgage payments = "Housing"
      - Online retail purchases (Amazon, Rakuten) = "Retail" or "Online Retail"
      - Software and online subscriptions = "Software/Subscription"

      Return the data as a valid JSON with two properties: 
      1. "summary" - an object with the statement summary information including the total bill amount
      2. "transactions" - an array of transaction objects
      
      Example format:
      {
        "summary": {
          "accountNumber": "123456789",
          "period": {
            "startDate": "2023-04-01",
            "endDate": "2023-04-30"
          },
          "openingBalance": 1500.25,
          "totalPaidIn": 3000.50,
          "totalPaidOut": 2450.75,
          "closingBalance": 2050.00,
          "totalBillAmount": 548252, 
          "currency": "JPY"
        },
        "transactions": [
          {
            "date": "2023-04-15",
            "description": "UBER EATS",
            "amount": -25.75,
            "category": "Eating Out",
            "balance": 2124.50
          }
        ]
      }
    `;

    // Make request to Gemini API
    const response = await fetch(
      `${GEMINI_API_URL}/models/${GEMINI_PDF_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    mime_type: "application/pdf",
                    data: base64Data,
                  },
                },
                { text: prompt },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the generated content from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No text generated from the model");
    }

    // Extract the JSON part from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsedData = JSON.parse(jsonMatch[0]);
      return parsedData;
    } else {
      // If no JSON structure was found, try to parse the entire response
      try {
        return JSON.parse(generatedText);
      } catch (e) {
        throw new Error("Failed to extract transaction data from response");
      }
    }
  } catch (error) {
    console.error("Error processing PDF with Gemini:", error);
    throw error;
  }
}

/**
 * Generate spending insights based on transaction data
 * @param transactions Array of transaction objects with date, description, amount, and category
 * @returns Financial insights object with summaries and recommendations
 */
export async function generateSpendingInsights(
  transactions: {
    date: string;
    description: string;
    amount: number;
    category: string;
  }[]
) {
  try {
    if (!transactions || !transactions.length) {
      throw new Error("No transaction data provided");
    }

    // Prepare the transaction data for the prompt
    const transactionData = JSON.stringify(transactions);

    // Create a prompt for Gemini to analyze the transactions
    const prompt = `
      As a personal financial advisor, analyze these transactions and provide financial insights.
      
      Transaction data:
      ${transactionData}
      
      Please provide the following:
      
      1. Top Spending Categories: Identify the top 3-5 categories where most money was spent, with amounts and percentages.
      
      2. Monthly Summary: Summarize total income, expenses, and net cash flow.
      
      3. Unusual Activity: Identify any unusually large transactions or spending patterns that seem abnormal.
      
      4. Spending Trends: Identify any notable spending trends or patterns.
      
      5. Actionable Recommendations: Provide 2-3 specific, practical recommendations to improve financial health based on the transaction data.
      
      Return the data as a valid JSON object with these sections as properties.
      Example format:
      {
        "topCategories": [
          {"category": "Eating Out", "amount": 450.25, "percentage": 28},
          {"category": "Transportation", "amount": 350.00, "percentage": 22},
          {"category": "Entertainment", "amount": 200.75, "percentage": 13}
        ],
        "monthlySummary": {
          "totalIncome": 3000.00,
          "totalExpenses": 1600.50,
          "netCashFlow": 1399.50
        },
        "unusualActivity": [
          {"description": "Large withdrawal of $500 on March 15", "amount": 500.00}
        ],
        "spendingTrends": "Spending on food delivery has increased by 30% compared to previous periods. Entertainment expenses remain consistent.",
        "recommendations": [
          "Consider reducing food delivery expenses by cooking at home more often",
          "Set up automatic transfers to savings for the consistent surplus of ~$1400/month"
        ]
      }
    `;

    // Make request to Gemini API using the faster model for insights
    const response = await fetch(
      `${GEMINI_API_URL}/models/${GEMINI_INSIGHTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract the generated content from the response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No insights generated from the model");
    }

    // Extract the JSON part from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Failed to extract insights data from response");
    }
  } catch (error) {
    console.error("Error generating insights with Gemini:", error);
    throw error;
  }
}

/**
 * Convert a file to base64 encoding
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = (error) => reject(error);
  });
}


import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "../types";

// Always use the process.env.API_KEY for initializing GoogleGenAI
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const analyzeBankStatement = async (pdfBase64: string): Promise<Transaction[]> => {
  const modelName = 'gemini-3-flash-preview';
  
  const prompt = `
    Analyze this bank statement PDF. It is likely image-based, so please perform robust OCR.
    Extract every transaction into a structured JSON array.
    
    For each row in the statement:
    1. Identify the 'Date'.
    2. Identify the 'Details' or 'Description'.
    3. Identify the 'Withdrawals' (or Debits) and 'Deposits' (or Credits).
    4. Identify the 'Balance'.
    
    Tagging Rules for the 'tag' field (case-insensitive):
    - If detail contains "subscription", "netflix", "spotify", "dropout", "disney", or "OSN" as distinct words -> tag is "subscription".
    - If detail contains "talabat", "deliveroo", "qclub", "viva", "catering", "cateri", "coffee", "coffe", "tea", "sweets", "chocolate", "eater", "african and eastern", "deli", "fnb", "rest", "resto", "restauran", or "restaurant" as distinct words -> tag is "food".
    - If detail contains "amazon" as a distinct word -> tag is "amazon".
    - If detail contains "novomed" or "NMED" as distinct words -> tag is "therapy".
    - If detail contains "freshlanida", "carrefour", "spinneys", "spinney", "waitrose", "union coop", "lulu", "grandiose", "nesto", "choithram", "choithrams", "al maya", "west zone", "day to day", "noon minutes", "instashop", "qclub", "viva", "minimart", "hypermarket", "hypermart", "supermarket", "superma", "market", "catering", or "grocery" as distinct words -> tag is "grocery".
    - If detail contains "taxi" or "CAREEM" as distinct words -> tag is "taxi".
    - If detail contains "ENOC", "ADNOC", or "EMARAT" as distinct words -> tag is "gas".
    - If detail contains "Laundry" as a distinct word -> tag is "laundry".
    - If detail contains "dewa", "dubai electricity", "water", "authority", "empower", "district cooling", "etisalat", "e&", "du", "gas", "dubai gas", "emirates gas", "smart dubai", "smartdxb", "dubai municipality", or "housing fee" as distinct words -> tag is "amenities".
    - IMPORTANT: Do NOT tag "DUBAI" as "amenities" just because it contains "DU". "DU" must be a standalone word.
    - If detail contains "MARRIOTT" as a distinct word -> tag is "massage".
    - If detail contains "temu" as a distinct word -> tag is "temu".
    - If detail contains "justlife" as a distinct word -> tag is "Cleaner".
    - If detail contains "rent" as a distinct word -> tag is "rent".
    - If detail matches the pattern "AE" followed by a series of numbers (like an IBAN or transfer ID) -> tag is "Transfers".
    - If detail contains "PETS" as a distinct word -> tag is "vet".
    - If detail contains "medical" or "hospital" as distinct words -> tag is "hospital".
    - Otherwise, the 'tag' should be the original 'detail'.
    
    Important Formatting:
    - Amounts should be positive numbers.
    - Type must be either "withdrawal" or "deposit".
    - Ensure 'balance' is a number.
  `;

  // Use ai.models.generateContent with both model name and prompt/parts.
  const response = await ai.models.generateContent({
    model: modelName,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBase64
          }
        },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            detail: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['withdrawal', 'deposit'] },
            amount: { type: Type.NUMBER },
            balance: { type: Type.NUMBER },
            tag: { type: Type.STRING }
          },
          required: ['detail', 'type', 'amount', 'balance', 'tag']
        }
      }
    }
  });

  try {
    // The response.text property directly returns the extracted string output.
    const rawData = JSON.parse(response.text || '[]');
    const processedTransactions: Transaction[] = [];
    let uaeswchTagged = false;
    
    for (const item of rawData) {
      const detailUpper = item.detail.toUpperCase();
      const isTaxOrSvc = detailUpper.includes("VAT") || detailUpper.includes("SVC CHG");
      
      let finalTag = item.tag;
      
      // Helper for exact word matching
      const hasWord = (text: string, word: string) => {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Matches word with boundaries (start/end of string, space, or non-alphanumeric)
        const regex = new RegExp(`(^|[^A-Z0-9])${escaped}([^A-Z0-9]|$)`, 'i');
        return regex.test(text);
      };

      // Post-processing overrides for accuracy
      const foodKeywords = ["TALABAT", "DELIVEROO", "QCLUB", "VIVA", "CATERING", "CATERI", "COFFEE", "COFFE", "TEA", "SWEETS", "CHOCOLATE", "EATER", "AFRICAN AND EASTERN", "DELI", "FNB", "REST", "RESTO", "RESTAURAN", "RESTAURANT"];
      const amenitiesKeywords = ["DEWA", "DUBAI ELECTRICITY", "WATER", "AUTHORITY", "EMPOWER", "DISTRICT COOLING", "ETISALAT", "E&", "DU", "GAS", "DUBAI GAS", "EMIRATES GAS", "SMART DUBAI", "SMARTDXB", "DUBAI MUNICIPALITY", "HOUSING FEE"];
      const groceryKeywords = ["FRESHLANIDA", "CARREFOUR", "SPINNEYS", "SPINNEY", "WAITROSE", "UNION COOP", "LULU", "GRANDIOSE", "NESTO", "CHOITHRAM", "CHOITHRAMS", "AL MAYA", "WEST ZONE", "DAY TO DAY", "NOON MINUTES", "INSTASHOP", "QCLUB", "VIVA", "MINIMART", "HYPERMARKET", "HYPERMART", "SUPERMARKET", "SUPERMA", "MARKET", "CATERING", "GROCERY"];
      
      if (foodKeywords.some(kw => hasWord(detailUpper, kw))) {
        finalTag = "food";
      } else if (amenitiesKeywords.some(kw => hasWord(detailUpper, kw))) {
        finalTag = "amenities";
      } else if (groceryKeywords.some(kw => hasWord(detailUpper, kw))) {
        finalTag = "grocery";
      } else if (hasWord(detailUpper, "RENT")) {
        finalTag = "rent";
      } else if (hasWord(detailUpper, "JUSTLIFE")) {
        finalTag = "Cleaner";
      } else if (hasWord(detailUpper, "TAXI") || hasWord(detailUpper, "CAREEM")) {
        finalTag = "taxi";
      }
      else if (detailUpper.includes("UAESWCH") && item.amount === 1000 && item.type === 'withdrawal') {
        if (!uaeswchTagged) {
          finalTag = "Cleaner";
          uaeswchTagged = true;
        } else {
          finalTag = item.detail; 
        }
      }

      if (isTaxOrSvc && processedTransactions.length > 0) {
        let merged = false;
        for (let i = processedTransactions.length - 1; i >= 0; i--) {
          if (processedTransactions[i].type === TransactionType.WITHDRAWAL) {
            processedTransactions[i].amount += item.amount;
            processedTransactions[i].balance = item.balance;
            merged = true;
            break;
          }
        }
        if (!merged) {
          processedTransactions.push({
            ...item,
            tag: finalTag,
            id: `tx-${processedTransactions.length}-${Date.now()}`,
            type: item.type === 'withdrawal' ? TransactionType.WITHDRAWAL : TransactionType.DEPOSIT
          });
        }
      } else {
        processedTransactions.push({
          ...item,
          tag: finalTag,
          id: `tx-${processedTransactions.length}-${Date.now()}`,
          type: item.type === 'withdrawal' ? TransactionType.WITHDRAWAL : TransactionType.DEPOSIT
        });
      }
    }

    return processedTransactions;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Failed to process the statement data. Please ensure the PDF is a valid bank statement.");
  }
};

export const analyzeCategoryComparison = async (category: string, dataPoints: { fileName: string, amount: number }[]): Promise<string> => {
  const modelName = 'gemini-3-flash-preview';
  
  const dataString = dataPoints.map(dp => `${dp.fileName}: $${dp.amount.toFixed(2)}`).join(', ');
  
  const prompt = `
    Analyze the spending for the category "${category}" across multiple bank statements:
    Data: ${dataString}
    
    Provide a very brief (max 15 words) comment on the trend or change. 
    Examples: 
    - "Spending increased significantly in the latest statement."
    - "Consistent spending across all periods."
    - "Major drop in expenses compared to previous month."
    - "Roughly the same with minor fluctuations."
    
    Be concise and direct.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Comparison analysis failed:", error);
    return "Analysis unavailable.";
  }
};

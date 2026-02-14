
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
    - If detail includes "subscription", "netflix", "spotify", "dropout", "disney", or "OSN" -> tag is "subscription".
    - If detail includes "talabat" -> tag is "food".
    - If detail includes "amazon" -> tag is "amazon".
    - If detail includes "novomed" or "NMED" -> tag is "therapy".
    - If detail includes "freshlanida", "market", or "supermarket" -> tag is "grocery".
    - If detail includes "taxi" or "CAREEM" -> tag is "taxi".
    - If detail includes "ENOC", "ADNOC", or "EMARAT" -> tag is "gas".
    - If detail includes "Laundry" -> tag is "laundry".
    - If detail includes "DU" or "DEWA" -> tag is "amenities".
    - If detail includes "MARRIOTT" -> tag is "massage".
    - If detail includes "temu" -> tag is "temu".
    - If detail includes "justlife" -> tag is "Cleaner".
    - If detail matches the pattern "AE" followed by numbers (e.g., AE123...) -> tag is "Transfers".
    - If detail includes "PETS" -> tag is "vet".
    - If detail includes "medical" or "hospital" -> tag is "hospital".
    - Otherwise, the 'tag' should be the original 'detail'.
    
    Important Formatting:
    - Amounts should be positive numbers.
    - Type must be either "withdrawal" or "deposit".
    - Ensure 'balance' is a number.
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64
            }
          },
          { text: prompt }
        ]
      }
    ],
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
    const rawData = JSON.parse(response.text);
    const processedTransactions: Transaction[] = [];
    let uaeswchTagged = false;
    
    for (const item of rawData) {
      const detailUpper = item.detail.toUpperCase();
      const isTaxOrSvc = detailUpper.includes("VAT") || detailUpper.includes("SVC CHG");
      
      let finalTag = item.tag;
      
      // Strict Cleaner Logic:
      // 1. "justlife" is always "Cleaner"
      if (detailUpper.includes("JUSTLIFE")) {
        finalTag = "Cleaner";
      }
      // 2. Only ONE "UAESWCH" withdrawal of exactly 1000 is allowed
      else if (detailUpper.includes("UAESWCH") && item.amount === 1000 && item.type === 'withdrawal') {
        if (!uaeswchTagged) {
          finalTag = "Cleaner";
          uaeswchTagged = true;
        } else {
          finalTag = item.detail; // Revert to detail if second instance
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

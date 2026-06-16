import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

function safeParseJson(text: string): any {
  if (!text) return {};
  let cleanText = text;
  // Strip markdown formatting if Gemini wrapped the response
  cleanText = cleanText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  
  // Find the first { and last } to ensure we only parse the JSON object
  const startIndex = cleanText.indexOf('{');
  const endIndex = cleanText.lastIndexOf('}');
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    cleanText = cleanText.substring(startIndex, endIndex + 1);
  }
  
  try {
    return JSON.parse(cleanText);
  } catch (e: any) {
    console.error("JSON parse failed. Raw text length: " + text.length + ". Error: " + e.message);
    throw new Error("AI response was cut off or contained invalid formatting. Please try again with shorter content or wait a moment.");
  }
}

const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

app.post("/api/parse-recipe", async (req, res) => {
  try {
    const { url, imageData, mimeType } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing. Please set it in Settings > Secrets." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const parts = [];
    if (url) {
      parts.push({ text: `Extract the recipe title, ingredients with exact amounts/quantities, and step-by-step instructions from this URL or text:\n\n${url}\n\nIf it's a URL and you can access it, use its contents. Otherwise, attempt to extract based on the text. Return structured JSON.` });
    } else if (imageData && mimeType) {
      parts.push({ text: "Extract the recipe title, ingredients with exact amounts/quantities it shows, and step-by-step instructions from this image. Return structured JSON." });
      parts.push({
        inlineData: {
          data: imageData,
          mimeType: mimeType,
        },
      });
    } else {
      return res.status(400).json({ error: "Missing url or image data." });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The name or title of the recipe."
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Name of the ingredient" },
                  quantity: { type: Type.STRING, description: "Amount or quantity (e.g., '1 cup', '200g')" }
                },
              },
              description: "The list of ingredients for the recipe."
            },
            instructions: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "The step-by-step cooking instructions."
            },
            time: {
              type: Type.STRING,
              description: "Estimated total cooking or preparation time (e.g., '30 mins'). Leave empty if not available."
            },
            difficulty: {
              type: Type.STRING,
              description: "Estimated difficulty (e.g., 'Easy', 'Medium', 'Hard')."
            },
            calories: {
              type: Type.NUMBER,
              description: "Estimated calories per serving if available."
            },
            servings: {
              type: Type.NUMBER,
              description: "Number of servings the recipe yields."
            }
          }
        },
      }
    });

    res.json(safeParseJson(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to parse recipe" });
  }
});

app.post("/api/scan-food", async (req, res) => {
  try {
    const { imageData, mimeType } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    if (!imageData || !mimeType) {
      return res.status(400).json({ error: "Missing image data." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const parts = [
      { text: "Identify the single main food item or ingredient in this image. Return its name (in English or the same language as marked on packaging if clear) and the best matching category from this list: Meat & Seafood, Produce, Dairy & Eggs, Bakery, Pantry, Snacks, Beverages, Frozen Food. Return structured JSON." },
      { inlineData: { data: imageData, mimeType: mimeType } }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             name: { type: Type.STRING, description: "Identified food generic name or product name" },
             category: { type: Type.STRING, description: "Category of the food item" }
          }
        }
      }
    });

    res.json(safeParseJson(response.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to scan food" });
  }
});

app.post("/api/scan-receipt", async (req, res) => {
  try {
    const { imageData, mimeType } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    if (!imageData || !mimeType) {
      return res.status(400).json({ error: "Missing image data." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const parts = [
      { text: "Extract store name, purchase date, and array of purchased grocery items. Do NOT use strict formatting rules—normalize into standard strings. Cleanly handle negative numeral strings (like '10.00-' or discounts) and multi-items. For dates, return YYYY-MM-DD. Ignore taxes/fees. Extract only food items. Return structured JSON." },
      { inlineData: { data: imageData, mimeType: mimeType } }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
             storeName: { type: Type.STRING },
             date: { type: Type.STRING, description: "YYYY-MM-DD or recognized format" },
             items: {
               type: Type.ARRAY,
               items: {
                 type: Type.OBJECT,
                 properties: {
                   name: { type: Type.STRING },
                   price: { type: Type.STRING, description: "Price paid. Return exactly as string, e.g. '10.00', '3.00-'." },
                   quantity: { type: Type.STRING, description: "Quantity or weight like '1', '0.5 kg', '2 lbs' etc" },
                   category: { type: Type.STRING, description: "Best category from: Dairy & Eggs, Vegetables, Meat & Seafood, Pantry, Grains, Fruits, Bakery, Frozen, Household" }
                 }
               }
             }
          }
        }
      }
    });

    res.json(safeParseJson(response.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to scan receipt" });
  }
});

app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { inventory, ingredients } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    let primaryList: string[] = [];
    let secondaryList: string[] = [];

    if (Array.isArray(inventory) && inventory.length > 0) {
      inventory.forEach((item: any) => {
        const isExpiring = item.isExpiringSoon || (item.daysLeft !== undefined && item.daysLeft <= 2);
        const qtyStr = item.quantity ? `: ${item.quantity}` : '';
        const desc = `${item.name}${qtyStr}${isExpiring ? ' (EXPIRING SOON - MUST USE)' : ''}`;
        
        if (isExpiring) {
          primaryList.push(desc);
        } else {
          secondaryList.push(desc);
        }
      });
    }

    // Fallback if no inventory passed but ingredients list is available
    if (primaryList.length === 0 && secondaryList.length === 0 && Array.isArray(ingredients)) {
      secondaryList = ingredients;
    }

    if (primaryList.length === 0 && secondaryList.length === 0) {
      return res.status(400).json({ error: "No inventory items available to suggest recipes." });
    }

    const primaryStr = primaryList.length > 0 ? primaryList.join(", ") : "None specifically expiring soon";
    const availableStr = secondaryList.length > 0 ? secondaryList.join(", ") : "None";

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const promptText = `You are an expert home cook. You MUST design ONE delicious, foolproof, simple home-cooked meal recipe based strictly around what the user CURRENTLY has in stock in their Kitchen Inventory.

Kitchen Inventory:
- PRIMARY INGREDIENTS (Expiring soon or priority items to clear): ${primaryStr}
- OTHER AVAILABLE INGREDIENTS (In stock in cupboard/fridge): ${availableStr}

Strict prompt instructions:
1. You MUST prioritize using the PRIMARY INGREDIENTS as the absolute foundation of the recipe to help the user efficiently clear out their fridge before food goes bad.
2. Minimize any external required ingredients to bare pantry staples only (like salt, pepper, oil, water).
3. Do NOT suggest recipes requiring elaborate extra grocery items. Focus strictly on maximizing the use of what's provided above.

Return the response strictly as a clean, minified JSON object matching this schema. do NOT include any markdown block formatting or introductory/conversational prose.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Name/title of the recipe" },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Ingredient name string" },
                  quantity: { type: Type.STRING, description: "Amount or quantity string" }
                },
                required: ["name", "quantity"]
              },
              description: "Distinct items and their exact quantities used in the recipe, prioritizing the provided inventory. Only add bare pantry staples (salt, water, oil, pepper) as secondary additions."
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: "A simple ordered cooking step/action description" },
              description: "Step-by-step preparation instructions"
            }
          },
          required: ["title", "ingredients", "steps"]
        }
      }
    });

    res.json(safeParseJson(response.text || "{}"));
  } catch (error: any) {
    console.error("Recipe generation fail:", error);
    res.status(500).json({ error: error.message || "Failed to generate recipe" });
  }
});

async function startServer() {
  app.get("/site.webmanifest", (req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    const manifestPath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "site.webmanifest")
      : path.join(process.cwd(), "public", "site.webmanifest");
    res.sendFile(manifestPath);
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

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

app.post("/api/scan-food", upload.any(), async (req, res) => {
  try {
    let base64Data: string | undefined;
    let mimeType: string | undefined;

    const reqFile = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : undefined);

    if (reqFile) {
      base64Data = reqFile.buffer.toString("base64");
      mimeType = reqFile.mimetype;
      const ext = path.extname(reqFile.originalname || "").toLowerCase();
      if (ext === ".heic" || ext === ".heif") {
        mimeType = "image/heic";
      } else if (mimeType === "application/octet-stream" || !mimeType) {
        if (ext === ".png") mimeType = "image/png";
        else if (ext === ".webp") mimeType = "image/webp";
        else if (ext === ".heic" || ext === ".heif") mimeType = "image/heic";
        else mimeType = "image/jpeg";
      }
    } else if (req.body && req.body.imageData) {
      base64Data = req.body.imageData;
      mimeType = req.body.mimeType || "image/jpeg";
    }

    const supportedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
      mimeType = "image/jpeg";
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    if (!base64Data) {
      return res.status(400).json({ error: "Missing image data or file." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const promptText = `Identify the single main food item or raw ingredient shown in this image. 
Return its name (prefer a user-friendly, descriptive noun in English. If the packaging labels or food is clearly identifiable, write its title, e.g. "Beef Ribeye" or "Sliced Salmon") and the best matching category from this list: Dairy & Eggs, Vegetables, Meat & Seafood, Pantry, Grains, Fruits, Bakery, Frozen, Household.
Provide structured JSON.`;

    const parts = [
      { text: promptText },
      { inlineData: { data: base64Data, mimeType: mimeType } }
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
          },
          required: ["name", "category"]
        }
      }
    });

    res.json(safeParseJson(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini Scan Food Error:", error);
    res.status(500).json({ error: error.message || "Failed to scan food" });
  }
});

app.post(["/api/scan-receipt", "/api/parse-receipt"], upload.any(), async (req, res) => {
  try {
    let base64Data: string | undefined;
    let mimeType: string | undefined;

    const reqFile = req.file || (req.files && Array.isArray(req.files) ? req.files[0] : undefined);

    // Check if uploaded via form-data or JSON base64
    if (reqFile) {
      base64Data = reqFile.buffer.toString("base64");
      mimeType = reqFile.mimetype;
      const ext = path.extname(reqFile.originalname || "").toLowerCase();
      if (ext === ".heic" || ext === ".heif") {
        mimeType = "image/heic";
      } else if (mimeType === "application/octet-stream" || !mimeType) {
        if (ext === ".png") mimeType = "image/png";
        else if (ext === ".webp") mimeType = "image/webp";
        else if (ext === ".heic" || ext === ".heif") mimeType = "image/heic";
        else mimeType = "image/jpeg";
      }
    } else if (req.body && req.body.imageData) {
      base64Data = req.body.imageData;
      mimeType = req.body.mimeType || "image/jpeg";
    }

    const supportedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!mimeType || !supportedMimeTypes.includes(mimeType)) {
      mimeType = "image/jpeg";
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    if (!base64Data) {
      return res.status(400).json({ error: "Missing image data or file." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const promptText = `Analyze this receipt image from any commercial store or supermarket (e.g., T&T Supermarket, Costco, Real Canadian Superstore, Walmart, Safeway, local grocery stores, specialty shops, etc.). 
Your sole task is to visually locate, extract, and normalize the items into a structured list. Ignore store banners, loyalty points, or payment details. Focus strictly on extracting: Product Name, Unit Price/Total Price, and Quantity.

Enforce these rules strictly:
1. Return our standardized JSON object schema, even if the receipt is heavily crumpled, stained, or handwritten.
2. If the store name is not visible, clear, or missing, output "Unknown Store".
3. If the purchase date is not visible, empty, or unreadable, output the current date of 2026-06-16 or a fallback like the current day.
4. If a line item is too blurry or unreadable, output it as best as it can or label it "Unknown Item" with price "$0.00", allowing the user to edit it manually, rather than throwing a system-level parsing error.
5. In your array of items, make sure to ignore taxes, fee lines, discounts as separate items (you can subtract discounts from item prices or ignore discount lines completely).
6. Categories MUST be mapped strictly to one of these values: Dairy & Eggs, Vegetables, Meat & Seafood, Pantry, Grains, Fruits, Bakery, Frozen, Household. Fallback to "Pantry" if uncertain.
`;

    const parts = [
      { text: promptText },
      { inlineData: { data: base64Data, mimeType: mimeType } }
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
                 },
                 required: ["name"]
               }
             }
          },
          required: ["storeName", "items"]
        }
      }
    });

    res.json(safeParseJson(response.text || "{}"));
  } catch (error: any) {
    console.error("Gemini API Receipt Error:", error);
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

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
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
      model: "gemini-2.5-flash",
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
      },
    });

    let text = response.text || "{}";
    // Strip markdown formatting if Gemini wrapped the response
    text = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    
    // Find the first { and last } to ensure we only parse the JSON object
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      text = text.substring(startIndex, endIndex + 1);
    }
    
    let parsedData = {};
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse failed. Raw text:", text);
    }

    res.json(parsedData);
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
      model: "gemini-2.5-flash",
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

    res.json(JSON.parse(response.text || "{}"));
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
      { text: "Parse the receipt line-by-line and extract the store name, purchase date, and array of purchased, physical grocery items found (skip taxes, discounts, non-food items if possible). For each item extract the name, price paid (numeric), and quantity/weight. Return structured JSON." },
      { inlineData: { data: imageData, mimeType: mimeType } }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
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
                   price: { type: Type.NUMBER },
                   quantity: { type: Type.STRING, description: "Quantity or weight like '1', '0.5 kg', '2 lbs' etc" },
                   category: { type: Type.STRING, description: "Best category from: Dairy & Eggs, Vegetables, Meat & Seafood, Pantry, Grains, Fruits, Bakery, Frozen, Household" }
                 }
               }
             }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to scan receipt" });
  }
});

app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key is missing." });
    }

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: "No inventory items available to suggest recipes." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const parts = [
      { text: `You are an expert home cook. Suggest ONE delicious, foolproof, simple home-cooked meal recipe that utilizes one or more of the following available ingredients: ${ingredients.join(", ")}. Complement with basic pantry items if necessary. Return the response in structured JSON with recipe title, ingredients, step-by-step instructions (cooking steps), and preparation time.` }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts },
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
                  name: { type: Type.STRING, description: "Ingredient name" },
                  quantity: { type: Type.STRING, description: "Quantity or weight (e.g., '1 cup', '150g', '2 units')" }
                }
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: "Clear cooking steps" }
            },
            time: { type: Type.STRING, description: "Preparation/cooking time (e.g. '20 mins')" }
          }
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Recipe generation fail:", error);
    res.status(500).json({ error: error.message || "Failed to generate recipe" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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

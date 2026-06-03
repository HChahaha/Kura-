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
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        tools: [{ googleSearch: {} }],
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

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to parse recipe" });
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

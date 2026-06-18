import express from "express";
import path from "path";
import appRouter from "./api-router.js";

const PORT = 3000;
const app = express();

// Mount the API router
app.use(appRouter);

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

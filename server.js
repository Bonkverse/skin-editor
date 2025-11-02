// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from dist
app.use(express.static(path.join(__dirname, "dist")));

// Example API route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ✅ Fallback for SPA routes (Express 5-safe)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Railway will inject PORT automatically
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});

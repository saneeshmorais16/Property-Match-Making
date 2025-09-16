import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./supabase";
import { hybridMatch } from "./match";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/users", async (_req, res) => {
  const { data, error } = await supabase.from("users").select("id,name").order("created_at",{ascending:false}).limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data: data || [] });
});

app.get("/api/landlords", async (_req, res) => {
  const { data, error } = await supabase.from("landlords").select("id,name").order("created_at",{ascending:false}).limit(200);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data: data || [] });
});

app.get("/api/match", async (req, res) => {
  try {
    const side = (req.query.side as "user"|"landlord") || "user";
    const id = String(req.query.id || "");
    const alpha = req.query.alpha ? Number(req.query.alpha) : 0.7;
    const topK = req.query.topK ? Number(req.query.topK) : 10;
    if (!id) return res.status(400).json({ error: "id is required" });
    const out = await hybridMatch(side, id, alpha, topK);
    res.json(out);
  } catch (e:any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));

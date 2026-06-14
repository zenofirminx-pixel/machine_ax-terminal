import ai from "../data/ai.json";
import dev from "../data/dev.json";
import socials from "../data/socials.json";
import gaming from "../data/gaming.json";

const DB = { ...ai, ...dev, ...socials, ...gaming };

export default function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "POST only"
    });
  }

  const q = String(req.body?.query || "")
    .toLowerCase()
    .trim();

  if (!q) {
    return res.status(400).json({
      ok: false,
      error: "empty query"
    });
  }

  const url = DB[q] || null;

  return res.status(200).json({
    ok: !!url,
    query: q,
    url
  });
}
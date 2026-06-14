import ai from "../data/ai.json";

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const q = String(req.query.q || "")
    .toLowerCase()
    .trim();

  return res.status(200).json({
    ok: true,
    query: q,
    url: ai[q] || null,
    total: Object.keys(ai).length
  });
}
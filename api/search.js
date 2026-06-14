import ai from "../data/ai.json";
import dev from "../data/dev.json";
import socials from "../data/socials.json";
import gaming from "../data/gaming.json";

const DB = {
  ...ai,
  ...dev,
  ...socials,
  ...gaming
};

export default function handler(req, res) {
  const q = String(req.query.q || "")
    .toLowerCase()
    .trim();

  if (!q) {
    return res.json({ ok: false, error: "empty query" });
  }

  const url = DB[q];

  if (url) {
    return res.json({
      ok: true,
      query: q,
      url
    });
  }

  return res.json({
    ok: false,
    query: q,
    error: "not found"
  });
}
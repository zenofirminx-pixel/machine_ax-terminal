import ai from "../data/ai.json";
import dev from "../data/dev.json";
import socials from "../data/socials.json";
import gaming from "../data/gaming.json";

const DB = {...ai,...dev,...socials,...gaming };

export default async function handler(req, res) {
  try {
    const q = req.query.q? String(req.query.q).toLowerCase().trim() : "";

    if (!q) {
      return res.status(400).json({
        ok: false,
        error: "empty query",
        message: "Ok le backend fonctionne mais query vide"
      });
    }

    const url = DB[q] || null;

    return res.status(200).json({
      ok: true,
      message: "Ok le backend fonctionne",
      query: q,
      url,
      found:!!url
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "internal server error",
      message: err.message
    });
  }
}
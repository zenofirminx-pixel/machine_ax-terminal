import ai from "../data/ai.json";
import dev from "../data/dev.json";
import socials from "../data/socials.json";
import gaming from "../data/gaming.json";

const DB = {...ai,...dev,...socials,...gaming };

export default async function handler(req, res) {
  // Ajoute ces 3 lignes pour CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = String(req.query.q || "").toLowerCase().trim();

  if (!q) {
    return res.json({
      ok: false,
      error: "empty query"
    });
  }

  const url = DB[q];

  const result = {
    ok:!!url,
    query: q,
    url: url || null
  };

  // 📖 WIKIPEDIA (résumé)
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`
    );

    if (wikiRes.ok) {
      const wiki = await wikiRes.json();
      result.wikipedia = {
        title: wiki.title,
        description: wiki.extract,
        url: wiki.content_urls?.desktop?.page || null
      };
    }
  } catch (e) {}

  // 🌐 DUCKDUCKGO (contexte + suggestions)
  try {
    const ddgRes = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&no_html=1`
    );

    if (ddgRes.ok) {
      const ddg = await ddgRes.json();
      result.duckduckgo = {
        title: ddg.Heading || null,
        abstract: ddg.Abstract || null,
        related: (ddg.RelatedTopics || [])
         .slice(0, 5)
         .map(r => ({
            text: r.Text,
            url: r.FirstURL
          }))
      };
    }
  } catch (e) {}

  return res.json(result);
}
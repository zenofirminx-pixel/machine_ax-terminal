import ai from "../data/ai.json";
import dev from "../data/dev.json";
import socials from "../data/socials.json";
import gaming from "../data/gaming.json";

const DB = {...ai,...dev,...socials,...gaming };

export default async function handler(req, res) {
  try {
    const q = req.query.q? String(req.query.q).toLowerCase().trim() : "";

    if (!q) {
      return res.status(400).json({ ok: false, error: "empty query" });
    }

    const url = DB[q] || null;

    let result = {
      ok: true,
      query: q,
      url
    };

    // Wikipedia SAFE - avec timeout + check content-type
    try {
      const wikiRes = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`,
        { signal: AbortSignal.timeout(4000) } // timeout 4s pour éviter de freeze
      );

      if (wikiRes.ok && wikiRes.headers.get("content-type")?.includes("application/json")) {
        const wiki = await wikiRes.json();
        result.wikipedia = {
          title: wiki.title || null,
          description: wiki.extract || null,
          url: wiki.content_urls?.desktop?.page || null
        };
      }
    } catch (e) {
      // On ignore silencieusement, c'est "SAFE"
      console.warn("Wikipedia fetch failed:", e.message);
    }

    // DuckDuckGo SAFE - avec timeout + check content-type
    try {
      const ddgRes = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_redirect=1&no_html=1`,
        { signal: AbortSignal.timeout(4000) }
      );

      if (ddgRes.ok && ddgRes.headers.get("content-type")?.includes("application/json")) {
        const ddg = await ddgRes.json();
        result.duckduckgo = {
          title: ddg.Heading || null,
          abstract: ddg.Abstract || null,
          related: Array.isArray(ddg.RelatedTopics)
           ? ddg.RelatedTopics.slice(0, 5)
               .filter(r => r.Text && r.FirstURL) // évite les topics vides
               .map(r => ({
                  text: r.Text || "",
                  url: r.FirstURL || ""
                }))
            : []
        };
      }
    } catch (e) {
      console.warn("DuckDuckGo fetch failed:", e.message);
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "internal server error"
    });
  }
}
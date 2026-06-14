function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

// 🧠 base de liens en dur
const DB = {
  github: "https://github.com",
  google: "https://google.com",
  youtube: "https://youtube.com",
  chatgpt: "https://chatgpt.com",
  vercel: "https://vercel.com",
  firebase: "https://firebase.google.com",
  twitter: "https://twitter.com",
  instagram: "https://instagram.com",
  tiktok: "https://tiktok.com",
  discord: "https://discord.com",
  reddit: "https://reddit.com",
  stackoverflow: "https://stackoverflow.com",
  npm: "https://npmjs.com",
  node: "https://nodejs.org"
};

export default function handler(req, res) {
  setCors(res);

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
export default async function handler(req, res) {
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

  try {
    const { query } = req.body || {};

    return res.status(200).json({
      ok: true,
      received: query || null,
      url: "https://github.com"
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      ok: false,
      error: "server error"
    });
  }
}
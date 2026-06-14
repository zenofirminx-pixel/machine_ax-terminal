export default function handler(req, res) {
  res.status(200).json({ 
    ok: true,
    message: "Ok le backend fonctionne",
    query: req.query.q || null
  });
}
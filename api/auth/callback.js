export default async function handler(req, res) {
  // 🟢 AUTORISATIONS CORS (Indispensable pour l'entente entre tes deux sites Vercel)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', 'https://firmin-history.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Gère la pré-vérification du navigateur (Preflight request)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non autorisé : Token manquant' });
    }

    const token = authHeader.split(' ')[1];
    
    // Décodage du token Base64 envoyé par le frontend
    const userData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

    // Renvoie des données de l'utilisateur au frontend
    return res.status(200).json(userData);
  } catch (e) {
    console.error("Erreur de décodage du token:", e);
    return res.status(400).json({ error: 'Token invalide ou corrompu' });
  }
}

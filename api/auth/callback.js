export default async function handler(req, res) {
  const { code } = req.query;

  // L'URL de ta PWA vers laquelle on renvoie obligatoirement l'utilisateur
  const PWA_URL = "https://firmin-history.vercel.app"; 

  if (!code) {
    return res.status(400).json({
      ok: false,
      error: "Code OAuth manquant de Google"
    });
  }

  try {
    // 🔁 1. Échange du code reçu contre les tokens de Google
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        // ⚠️ Cette URI doit correspondre EXACTEMENT à celle enregistrée dans ta console Google
        redirect_uri: process.env.GOOGLE_REDIRECT_URI, 
        grant_type: "authorization_code"
      })
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      throw new Error(tokens.error || "Impossible d'obtenir l'access_token de Google");
    }

    // 👤 2. Récupération des infos du profil Google de l'utilisateur
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    );

    const user = await userRes.json();

    // 🧠 3. Construction des données utilisateur pour AX Link
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture,
      locale: user.locale || "fr"
    };

    // 🔑 4. Encodage des données en Token Base64 (lisible par ton index.html)
    const token = Buffer.from(JSON.stringify(session)).toString('base64');

    // 🚀 5. REDIRECTION : On quitte l'API pour renvoyer l'utilisateur sur ta PWA en lui passant le token
    return res.redirect(`${PWA_URL}/?token=${token}`);

  } catch (err) {
    console.error("Erreur OAuth critique dans auth/callback.js:", err);
    // Renvoie à la PWA avec une erreur propre plutôt que de planter sur une page d'API blanche
    return res.redirect(`${PWA_URL}/?login=error`);
  }
}

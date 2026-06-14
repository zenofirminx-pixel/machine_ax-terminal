function setCors(res) {
  // On autorise explicitement ton Front (PWA) à venir interroger ce serveur
  res.setHeader("Access-Control-Allow-Origin", "https://firmin-history.vercel.app");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

// 🧠 Base de données étendue
const EXTENDED_DB = {
  // Dev & Tech
  github: "https://github.com",
  google: "https://google.com",
  youtube: "https://youtube.com",
  chatgpt: "https://chatgpt.com",
  vercel: "https://vercel.com",
  firebase: "https://firebase.google.com",
  stackoverflow: "https://stackoverflow.com",
  npm: "https://npmjs.com",
  node: "https://nodejs.org",
  mdn: "https://developer.mozilla.org",
  w3schools: "https://www.w3schools.com",
  codepen: "https://codepen.io",
  gitlab: "https://gitlab.com",
  figma: "https://figma.com",
  canva: "https://canva.com",

  // Réseaux Sociaux & Com
  twitter: "https://x.com",
  x: "https://x.com",
  instagram: "https://instagram.com",
  tiktok: "https://tiktok.com",
  discord: "https://discord.com",
  reddit: "https://reddit.com",
  linkedin: "https://linkedin.com",
  facebook: "https://facebook.com",
  twitch: "https://twitch.tv",
  pinterest: "https://pinterest.com",
  whatsapp: "https://whatsapp.com",

  // Streaming, Musique & Divertissement
  netflix: "https://netflix.com",
  spotify: "https://spotify.com",
  deezer: "https://deezer.com",
  crunchyroll: "https://crunchyroll.com",
  disney: "https://disneyplus.com",
  amazon: "https://amazon.fr",
  prime: "https://primevideo.com",

  // Encyclopédies & Savoir
  wikipedia: "https://wikipedia.org",
  wiki: "https://wikipedia.org",
  larousse: "https://larousse.fr",
  traducteur: "https://translate.google.com",
  translate: "https://translate.google.com"
};

const STOP_WORDS = ["ouvre", "va sur", "recherche", "siteweb", "site", "go to", "open", "http", "https", "www", ".", "com", "fr"];

export default function handler(req, res) {
  // Applique les règles CORS pour valider l'accès au Front
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST only" });
  }

  let originalQuery = String(req.body?.query || "").trim();
  let q = originalQuery.toLowerCase();

  if (!q) {
    return res.status(400).json({ ok: false, error: "empty query" });
  }

  // Nettoyage de la chaîne
  STOP_WORDS.forEach(word => {
    q = q.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
  });
  q = q.replace(/[^\w\s]/gi, '').trim();

  // Recherche directe
  let url = EXTENDED_DB[q] || null;

  // Recherche par mot-clé inclus dans la phrase
  if (!url) {
    const words = q.split(/\s+/);
    for (const word of words) {
      if (EXTENDED_DB[word]) {
        url = EXTENDED_DB[word];
        q = word;
        break;
      }
    }
  }

  // Génération d'URL à la volée (.com automatique pour les milliers de marques en dur)
  if (!url && q.length > 2 && !q.includes(" ")) {
    url = `https://${q}.com`;
  }

  let fakeDuckDuckGo = null;
  if (!url) {
    fakeDuckDuckGo = {
      title: `Résultats pour "${originalQuery}"`,
      abstract: `Voici une recherche rapide sur AX Link pour le terme "${originalQuery}". Vous pouvez utiliser des moteurs spécialisés ou reformuler pour des liens directs.`
    };
  }

  return res.status(200).json({
    ok: !!url,
    query: q,
    url: url,
    wikipedia: url && url.includes("wikipedia") ? { title: "Wikipédia", description: "L'encyclopédie libre.", url: url } : null,
    duckduckgo: fakeDuckDuckGo
  });
}

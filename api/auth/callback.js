import { serialize } from "cookie";

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      ok: false,
      error: "Missing OAuth code"
    });
  }

  try {
    // 🔁 1. Exchange code → tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      throw new Error(tokens.error || "No access_token");
    }

    // 👤 2. Get Google user info
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`
        }
      }
    );

    const user = await userRes.json();

    // 🧠 3. Build session (simple, lightweight)
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.picture
    };

    // 🍪 4. Cookie session (safe + simple)
    res.setHeader(
      "Set-Cookie",
      serialize("ax_session", JSON.stringify(session), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7
      })
    );

    // 🚀 5. Redirect vers UI chat
    return res.redirect(
      "https://aurx-network.vercel.app/?login=success"
    );

  } catch (err) {
    console.error("OAuth error:", err);

    return res.redirect(
      "https://aurx-network.vercel.app/?login=error"
    );
  }
}
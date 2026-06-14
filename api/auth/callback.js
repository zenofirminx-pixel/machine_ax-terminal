import { verifyGoogleToken } from "./google.js";

export default async function handler(req, res) {
  try {
    const { token } = req.body || req.query;

    if (!token) {
      return res.status(400).json({
        ok: false,
        error: "Missing token"
      });
    }

    const user = await verifyGoogleToken(token);

    const session = Buffer.from(JSON.stringify(user)).toString("base64");

    res.setHeader(
      "Set-Cookie",
      `aurx_token=${session}; Path=/; HttpOnly; SameSite=Lax`
    );

    return res.status(200).json({
      ok: true,
      user
    });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Callback error"
    });
  }
}
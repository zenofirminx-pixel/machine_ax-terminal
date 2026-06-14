import { parse } from "cookie";

export default function handler(req, res) {
  try {
    const cookies = parse(req.headers.cookie || "");

    const session = cookies.aurx_token;

    if (!session) {
      return res.status(401).json({
        ok: false,
        error: "No session"
      });
    }

    // 🔐 decode base64 -> JSON user
    const user = JSON.parse(
      Buffer.from(session, "base64").toString("utf-8")
    );

    if (!user || !user.id) {
      return res.status(401).json({
        ok: false,
        error: "Invalid session"
      });
    }

    return res.status(200).json({
      ok: true,
      user
    });

  } catch (err) {
    console.error("ME ERROR:", err);

    return res.status(401).json({
      ok: false,
      error: "Session corrupted"
    });
  }
}
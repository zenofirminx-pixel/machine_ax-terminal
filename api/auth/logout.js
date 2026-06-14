export default function handler(req, res) {
  res.setHeader(
    "Set-Cookie",
    "aurx_token=; Path=/; HttpOnly; Max-Age=0"
  );

  return res.status(200).json({
    ok: true,
    message: "Logged out"
  });
}
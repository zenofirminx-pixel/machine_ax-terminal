import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleToken(token) {
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const p = ticket.getPayload();

  return {
    uid: p.sub,
    name: p.name,
    email: p.email,
    photoURL: p.picture
  };
}
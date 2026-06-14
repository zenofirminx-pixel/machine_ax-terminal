import { db } from "../lib/firebase.js";
import { verifyGoogleToken } from "../lib/google.js";

export default async function handler(req, res) {
  try {
    const { action, payload } = req.body;

    let user = null;

    // 🔐 AUTH + AUTO USER CREATE
    if (payload?.token) {
      user = await verifyGoogleToken(payload.token);

      const ref = db.collection("users").doc(user.uid);
      const doc = await ref.get();

      if (!doc.exists) {
        await ref.set({
          ...user,
          followers: 0,
          following: 0,
          createdAt: Date.now()
        });
      }
    }

    // 📝 CREATE POST
    if (action === "createPost") {
      const post = await db.collection("posts").add({
        uid: user.uid,
        name: user.name,
        photoURL: user.photoURL,
        content: payload.content,
        likes: 0,
        comments: 0,
        createdAt: Date.now()
      });

      return res.json({ ok: true, postId: post.id });
    }

    // 📰 FEED GLOBAL
    if (action === "getFeed") {
      const snap = await db
        .collection("posts")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();

      return res.json({
        ok: true,
        feed: snap.docs.map(d => ({ id: d.id, ...d.data() }))
      });
    }

    // ❤️ LIKE
    if (action === "like") {
      const ref = db.collection("posts").doc(payload.postId);

      await db.runTransaction(async (tx) => {
        const doc = await tx.get(ref);
        if (!doc.exists) return;

        const data = doc.data();

        tx.update(ref, {
          likes: (data.likes || 0) + 1
        });

        tx.set(
          db.collection("likes").doc(`${payload.postId}_${user.uid}`),
          {
            postId: payload.postId,
            uid: user.uid,
            createdAt: Date.now()
          }
        );
      });

      return res.json({ ok: true });
    }

    // 💬 COMMENT
    if (action === "comment") {
      await db.collection("comments").add({
        postId: payload.postId,
        uid: user.uid,
        name: user.name,
        text: payload.text,
        createdAt: Date.now()
      });

      return res.json({ ok: true });
    }

    // ➕ FOLLOW
    if (action === "follow") {
      await db.collection("follows").doc(`${user.uid}_${payload.targetId}`).set({
        userId: user.uid,
        targetId: payload.targetId,
        createdAt: Date.now()
      });

      return res.json({ ok: true });
    }

    return res.json({ ok: false, error: "Unknown action" });

  } catch (err) {
    console.error(err);
    return res.json({ ok: false, error: "Server error" });
  }
}
/** Rejects requests from users who are not logged in. */
export function requireAuth(req, res, next) {
  if (req.isAuthenticated?.() && req.user) return next();
  return res.status(401).json({ error: "You must be logged in to do that." });
}

/** True when the logged-in user wrote this document. */
export function isOwner(req, doc) {
  return Boolean(req.user && doc && String(doc.authorId) === String(req.user._id));
}

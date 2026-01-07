const jwt =require("jsonwebtoken");

/**
 * Middleware: requireAuth
 * Rôle: bloquer l’accès si pas de JWT valide.
 *
 * Il attend un header:
 * Authorization: Bearer <token>
 */

function requireAuth(req, res ,next) {
     // 1) On récupère le header Authorization
     const header = req.get("authorization");

      // 2) S’il n’existe pas ou qu’il ne commence pas par "Bearer "
  //    => on refuse direct (401)
  if(!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Non authentifié"});
  }

    // 3) On extrait le token (tout ce qui suit "Bearer ")
    const token = header.split(" ")[1];

    try {
         /**
     * 4) Vérification du token
     * jwt.verify() :
     * - valide la signature avec JWT_SECRET
     * - vérifie l’expiration
     * - renvoie le payload si OK
     */
    const payload = jwt.verify(token, process.env.JWT_SECRET);
     /**
     * 5) On attache l’utilisateur à la requête
     * payload typique qu’on mettra plus tard:
     * { sub: userId, role: "admin", email: "..." }
     */
    req.user = payload;
      // 6) On laisse passer vers la route protégée
      return next();
    } catch (e) {
          // Si token invalide / expiré -> 401
          return res.status(401).json({ message: "Token invalide" });
    }
}

module.exports = {requireAuth};

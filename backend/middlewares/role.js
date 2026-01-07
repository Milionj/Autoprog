function requireRole(roles = []) {
return (req, res, next) => {
    // Sécurité : si requireAuth n'est pas passé avant, req.user n'existe pas.
    if(!req.user) {
        return res.status(401).json({ message : "Non authentifié "});
    }

    const userRole = req.user.role;

    // Si le rôle de l’utilisateur n’est pas dans la liste, accès interdit
    if (!roles.includes(userRole)) {
        return res.status(403).json({ message: "Accest interdit"});
    }

    //Sinon, on laisse passer
    return next();
}
}

module.exports = { requireRole };
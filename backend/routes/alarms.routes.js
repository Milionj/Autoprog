const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/role");

const router = express.Router();


/**
 * Route protégée (JWT).
 * acknowledged=false -> alarmes non acquittées
 * acknowledged=true  -> alarmes acquittées
 * (si param absent -> on renvoie tout)
 */

router.get("/", requireAuth, async (req, res) => {
    try {
        const acknowledged = req.query.acknowledged; // "false" | "true" | undefined

    let sql = `
      SELECT a.*, c.name AS capteur_name, c.unite
      FROM alarmes a
      JOIN capteurs c ON c.id_capteurs = a.id_capteurs
    `;

    
    // Filtre selon le query param
    if (acknowledged === "false") sql += " WHERE a.est_acquittee = 0";
    if (acknowledged === "true") sql += " WHERE a.est_acquittee = 1";

        sql += " ORDER BY a.date_heure DESC LIMIT 200";

        const [rows] = await pool.query(sql);
        return res.json(rows);
    } catch (e) {
        console.error("GET /alarms error:", e);
        return res.status(500).json({ message: "Erreur serveur"});
    }
});

router.patch("/:id/ack", requireAuth, requireRole(["operator", "admin"]), async (req, res) => {
  try {
    // 1) On récupère l'id depuis l'URL
    const id = Number(req.params.id);

    // 2) Validation simple
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "ID invalide" });
    }

    /**
     * 3) Update de l'alarme
     * - On met est_acquittee à 1
     * - On note la date d'acquittement
     * - On enregistre quel user a acquitté (req.user.sub)
     * - On évite de re-acquitter une alarme déjà acquittée (est_acquittee = 0)
     */
    const [result] = await pool.query(
      `UPDATE alarmes
       SET est_acquittee = 1,
           date_acquittement = NOW(),
           id_utilisateur = :userId
       WHERE id_alarmes = :id AND est_acquittee = 0`,
      { id, userId: req.user.sub }
    );

    // 4) Si aucune ligne modifiée : soit id inexistant, soit déjà acquittée
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Alarme introuvable ou déjà acquittée" });
    }

    return res.json({ message: "Alarme acquittée", id });
  } catch (e) {
    console.error("PATCH /alarms/:id/ack error:", e);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

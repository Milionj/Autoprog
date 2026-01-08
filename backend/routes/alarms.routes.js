const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middlewares/auth");

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

module.exports = router;

const express = require("express");
const {pool} = require("../db");
const { requireAuth} =require("../middlewares");

const router = express.Router();

/**

 * But : renvoyer la dernière mesure de chaque capteur.
 * On fait un LEFT JOIN pour garder les capteurs même s’ils n’ont pas encore de mesures.
 */

router.get("/lastest", requireAuth, async (requireAuth, res) => {
    try {
        const [rows] = await pool.query(
        `
      SELECT
        c.id_capteurs,
        c.name,
        c.unite,
        c.seuil_min,
        c.seuil_max,
        m.valeur_mesuree,
        m.date_heure
      FROM capteurs c
      LEFT JOIN mesures m
        ON m.id_mesures = (
          SELECT m2.id_mesures
          FROM mesures m2
          WHERE m2.id_capteurs = c.id_capteurs
          ORDER BY m2.date_heure DESC
          LIMIT 1
        )
      ORDER BY c.id_capteurs
    `);
    return res.json(rows);
    } catch (e) {
        console.error("GET /measurements/latest error:", e);
        return res.status(500).json({ message: "Erreur serveur"});
    }
});

module.exports = router;
const express = require("express");
const { pool } = require("../db");
const { requireAuth } = require("../middlewares/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    /**
     * Requête simple : on récupère les infos nécessaires au dashboard
     */
    const [rows] = await pool.query(
      `SELECT id_capteurs, name, unite, seuil_min, seuil_max
       FROM capteurs
       ORDER BY id_capteurs`
    );
    return res.json(rows);
  } catch (e) {
    // On évite de renvoyer l'erreur SQL brute au client
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;

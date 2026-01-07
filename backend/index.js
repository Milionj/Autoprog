// Charge le fichier .env dans process.env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// On importe le pool MySQL
const { pool } = require("./db");

const app = express();
/**
 * ====== MIDDLEWARES ======
 * Ils s'exécutent AVANT les routes.
 */

// Sécurité basique HTTP (réflexe);

app.use(helmet());

app.use(cors({ origin: "http://localhost:5173" }));

// Permet de lire le JSON envoyé par le client dans req.body
app.use(express.json());

// Log des requêtes (super utile pour debug)
app.use(morgan("dev"));


/**
 * ===== Route /health =====
 * Objectif : vérifier que
 * - l’API répond
 * - MySQL répond aussi (connexion OK)
 */
app.get("/health", async (req, res) => {
  try {
    // SELECT 1 = test minimal : si ça passe, la DB répond
    await pool.query("SELECT 1");

    return res.json({
      ok: true,
      api: "ok",
      db: "ok",
      dbName: process.env.DB_NAME
    });
  } catch (e) {
    // Ici : problème de connexion DB (host/port/user/password/db_name)
    return res.status(500).json({
      ok: false,
      api: "ok",
      db: "ko",
      message: e.message
    });
  }
});

/**
 * ===== Démarrage serveur =====
 */
app.listen(process.env.PORT, () => {
  console.log(`API running on http://localhost:${process.env.PORT}`);
});
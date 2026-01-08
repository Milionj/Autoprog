// Charge le fichier .env dans process.env
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { requireAuth } = require("./middlewares/auth");
const { requireRole } = require("./middlewares/role");
const authRoutes = require("./routes/auth.route");
const sensorsRoutes = require("./routes/sensors.routes");
const measurementsRoutes = require("./routes/measurements.routes");
const alarmsRoutes = require("./routes/alarms.routes");


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

app.use("/auth", authRoutes);

app.use("/sensors", sensorsRoutes);

app.use("/measurements", measurementsRoutes);

app.use("/alarms", alarmsRoutes);


// Route de test protégée
app.get("/protected", requireAuth, (req, res) => {
  // Si on arrive ici, c'est que le token est valide
  res.json({ ok: true, user: req.user });
});

// Route de test: accessible uniquement si connecté ET role operator/admin
app.get("/ops-only", requireAuth, requireRole(["operator", "admin"]), (req, res) => {
  res.json({ ok: true, message: "Bienvenue opérateur/admin", user: req.user });
});


/**
 * ===== Route /health =====
 * Objectif : vérifier que
 * - l’API répond
 * - MySQL répond aussi (connexion OK)
 */
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ ok: true, api: "ok", db: "ok", dbName: process.env.DB_NAME });
  } catch (e) {
    return res.status(500).json({ ok: false, api: "ok", db: "ko", message: e.message });
  }
});


/**
 * ===== Démarrage serveur =====
 */
app.listen(process.env.PORT, () => {
  console.log(`API running on http://localhost:${process.env.PORT}`);
});

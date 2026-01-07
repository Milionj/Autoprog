const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const { pool } = require("../db");

const router = express.Router();

/**
 * Rate limit sur /login
 * But: empêcher les attaques bruteforce (tester plein de mots de passe).
 */
 const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { message: "Trop de tentative , réessaie dans 1 minutes."},
 });

 /**
 * Validation Zod
 * But: bloquer les payloads vides ou bizarres, sécuriser le backend.
 */

 const loginSchema = z.object({
    username: z.string().min(3).max(150), // on utilisera email comme username
    password: z.string().min(3).max(200),
 });

//  POST /auth/login

router.post("/login", loginLimiter, async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Données invalides" });
  }

  const { username, password } = parsed.data;

  try {
    const [rows] = await pool.query(
      `SELECT id_utilisateur, email, mot_de_passe_hash, role
       FROM utilisateurs
       WHERE email = :email
       LIMIT 1`,
      { email: username }
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const user = rows[0];

    const passwordOk = await bcrypt.compare(password, user.mot_de_passe_hash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Identifiants invalides" });
    }

    const token = jwt.sign(
      { sub: user.id_utilisateur, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return res.json({
      token,
      user: { id: user.id_utilisateur, email: user.email, role: user.role },
    });
  } catch (e) {
    // Erreur serveur (DB down, SQL error, etc.)
    return res.status(500).json({ message: "Erreur serveur" });
  }
});


module.exports =router;

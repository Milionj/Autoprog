/**
 * Login.jsx
 * Objectif : connecter l'utilisateur.
 *
 * Étapes :
 * 1) L'utilisateur tape email + password
 * 2) On POST /auth/login au backend
 * 3) Le backend renvoie : { token, user: { id, email, role } }
 * 4) On stocke token + role dans localStorage
 * 5) On redirige vers "/"
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";

export default function Login() {
  const nav = useNavigate();

  // États du formulaire
  const [username, setUsername] = useState("admin@demo.local");
  const [password, setPassword] = useState("Admin123!");

  // États UI (erreur + chargement)
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /**
   * onSubmit
   * Appelé quand on clique sur "Se connecter"
   */
  async function onSubmit(e) {
    e.preventDefault(); // empêche le refresh de la page
    setError("");
    setLoading(true);

    try {
      // On appelle l'API login
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // On stocke le token pour les routes protégées
      localStorage.setItem("token", data.token);

      // On stocke le rôle pour l’UI (montrer/masquer des boutons)
      localStorage.setItem("role", data.user.role);

      // On va sur le dashboard
      nav("/");
    } catch (e) {
      // Si l’API renvoie 401 -> Identifiants invalides, etc.
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 380, margin: "80px auto", fontFamily: "Arial" }}>
      <h2>Login</h2>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input
            style={{ width: "100%", padding: 8 }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Password</label>
          <input
            style={{ width: "100%", padding: 8 }}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Affichage de l’erreur */}
        {error && (
          <div style={{ color: "crimson", marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "..." : "Se connecter"}
        </button>
      </form>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
        Comptes : admin / operateur / viewer
      </div>
    </div>
  );
}

/**
 * Dashboard.jsx
 * Objectif : afficher une mini supervision en temps réel (minimaliste).
 *
 * On récupère en boucle toutes les 2 secondes :
 * - /measurements/latest
 * - /alarms?acknowledged=false
 *
 * Et on permet :
 * - acquitter une alarme (si operator/admin)
 * - envoyer une commande (si operator/admin)
 */

import { useEffect, useMemo, useState } from "react";
import { apiFetch, getRole, logout } from "../api";

/**
 * computeStatus(value, min, max)
 * Rôle : donner un état simple au capteur :
 * - NO_DATA : pas de mesure
 * - ALARM : hors seuil
 * - WARN : proche du seuil (marge 5%)
 * - OK : normal
 */
function computeStatus(value, min, max) {
  if (value === null || value === undefined) return "NO_DATA";
  if (value < min || value > max) return "ALARM";

  const range = max - min;
  const warnMargin = range * 0.05;

  if (value < min + warnMargin || value > max - warnMargin) return "WARN";
  return "OK";
}

export default function Dashboard() {
  // Rôle récupéré depuis localStorage (set au login)
  const role = getRole() || "viewer";

  // Seuls admin/operator peuvent acquitter + commander
  const canOperate = role === "admin" || role === "operator";

  // Données principales
  const [latest, setLatest] = useState([]);
  const [alarms, setAlarms] = useState([]);

  // Erreur globale (ex: token expiré, backend down)
  const [error, setError] = useState("");

  /**
   * refresh()
   * Rôle : recharger les données depuis l’API
   * On fait un Promise.all pour gagner du temps (2 appels en parallèle)
   */
  async function refresh() {
    const [l, a] = await Promise.all([
      apiFetch("/measurements/latest"),
      apiFetch("/alarms?acknowledged=false"),
    ]);

    setLatest(l);
    setAlarms(a);
  }

  /**
   * useEffect() -> se lance au montage du composant
   * - fait un premier refresh
   * - puis démarre un setInterval (polling toutes les 2 sec)
   */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        await refresh();
      } catch (e) {
        if (alive) setError(e.message);
      }
    })();

    const id = setInterval(() => {
      refresh().catch(() => {
        // On ignore ici pour éviter de spammer l'écran
        // (on garde une première erreur dans setError)
      });
    }, 2000);

    // Nettoyage à la fin (évite memory leak)
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /**
   * cards : on transforme latest en "cards" avec status calculé
   * useMemo = évite de recalculer si latest n’a pas changé
   */
  const cards = useMemo(() => {
    return latest.map((s) => ({
      ...s,
      status: computeStatus(s.valeur_mesuree, s.seuil_min, s.seuil_max),
    }));
  }, [latest]);

  /**
   * ackAlarm(id)
   * Rôle : acquitter une alarme côté backend
   * Si OK : on l'enlève du state alarms (UI immédiate)
   */
  async function ackAlarm(id) {
    try {
      await apiFetch(`/alarms/${id}/ack`, { method: "PATCH" });

      // UI instantanée : on retire l’alarme acquittée de la liste
      setAlarms((prev) => prev.filter((a) => a.id_alarmes !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  /**
   * sendCommand(type)
   * Rôle : envoyer une commande (START_FAN / STOP_FAN / RESET)
   */
  async function sendCommand(type) {
    try {
      await apiFetch("/commands", {
        method: "POST",
        body: JSON.stringify({ type, target: "SYSTEM" }),
      });

      alert("Commande envoyée: " + type);
    } catch (e) {
      alert(e.message);
    }
  }

  /**
   * onLogout()
   * Rôle : effacer token/role et revenir au login
   */
  function onLogout() {
    logout();
    window.location.href = "/login";
  }

  // Si erreur globale (backend down, token expiré, etc.)
  if (error) {
    return (
      <div style={{ padding: 20, fontFamily: "Arial", color: "crimson" }}>
        Erreur: {error}
        <div style={{ marginTop: 10 }}>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <div>
          <span style={{ marginRight: 10 }}>role: {role}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>

      {/* CAPTEURS */}
      <h3>Capteurs (latest)</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {cards.map((c) => (
          <div key={c.id_capteurs} style={{ border: "1px solid #ddd", padding: 10 }}>
            <div style={{ fontWeight: "bold" }}>{c.name}</div>

            {/* Valeur + unité */}
            <div style={{ fontSize: 22 }}>
              {c.valeur_mesuree ?? "—"} {c.unite}
            </div>

            {/* Status calculé */}
            <div>
              status: <b>{c.status}</b>
            </div>

            {/* Seuils */}
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              seuil: {c.seuil_min} → {c.seuil_max}
            </div>
          </div>
        ))}
      </div>

      {/* ALARMES */}
      <h3 style={{ marginTop: 20 }}>Alarmes (non acquittées)</h3>

      {alarms.length === 0 ? (
        <div style={{ opacity: 0.7 }}>Aucune alarme</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {alarms.map((a) => (
            <div key={a.id_alarmes} style={{ border: "1px solid #ddd", padding: 10 }}>
              {/* Titre: capteur + gravité */}
              <div style={{ fontWeight: "bold" }}>
                {a.capteur_name} — {a.niveau_gravite}
              </div>

              {/* Message backend */}
              <div>{a.message}</div>

              {/* Date */}
              <div style={{ fontSize: 12, opacity: 0.7 }}>{a.date_heure}</div>

              {/* Bouton acquitter selon le rôle */}
              {canOperate ? (
                <button style={{ marginTop: 8 }} onClick={() => ackAlarm(a.id_alarmes)}>
                  Acquitter
                </button>
              ) : (
                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                  lecture seule
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* COMMANDES */}
      <h3 style={{ marginTop: 20 }}>Commandes</h3>
      {canOperate ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => sendCommand("START_FAN")}>START_FAN</button>
          <button onClick={() => sendCommand("STOP_FAN")}>STOP_FAN</button>
          <button onClick={() => sendCommand("RESET")}>RESET</button>
        </div>
      ) : (
        <div style={{ opacity: 0.7 }}>Pas autorisé</div>
      )}
    </div>
  );
}

const { pool } = require("./db");

/**
 * Petit utilitaire: nombre aléatoire entre min et max
 * decimals = nombre de décimales
 */
function randomBetween(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

/**
 * Détermine la gravité selon l'écart au seuil.
 * - null si dans les seuils
 * - LOW / MEDIUM / HIGH si hors seuil
 */
function computeSeverity(value, min, max) {
  if (value >= min && value <= max) return null;

  const range = max - min;
  const delta = value < min ? (min - value) : (value - max);

  if (delta > range * 0.2) return "HIGH";
  if (delta > range * 0.1) return "MEDIUM";
  return "LOW";
}

/**
 * Génère une valeur en fonction de l'unité (ou du nom)
 * -> le but est juste d'être "crédible", pas scientifiquement parfait.
 */
function generateValue(sensor) {
  const u = sensor.unite;

  if (u === "°C") return randomBetween(10, 70, 1);
  if (u === "bar") return randomBetween(0.8, 2.5, 2);
  if (u === "%") return randomBetween(0, 100, 0);

  // fallback si unité inconnue
  return randomBetween(sensor.seuil_min - 5, sensor.seuil_max + 5, 2);
}

/**
 * Insère une mesure en base
 */
async function insertMeasurement(sensorId, value) {
  await pool.query(
    "INSERT INTO mesures (id_capteurs, valeur_mesuree, date_heure) VALUES (:id, :value, NOW())",
    { id: sensorId, value }
  );
}

/**
 * Crée une alarme si hors seuil, avec anti-spam:
 * -> si une alarme NON acquittée existe déjà pour ce capteur, on n'en recrée pas.
 */
async function maybeCreateAlarm(sensor, value) {
  const sev = computeSeverity(value, sensor.seuil_min, sensor.seuil_max);
  if (!sev) return;

  // Anti-spam: une seule alarme active par capteur
  const [existing] = await pool.query(
    `SELECT id_alarmes
     FROM alarmes
     WHERE id_capteurs = :id AND est_acquittee = 0
     ORDER BY date_heure DESC
     LIMIT 1`,
    { id: sensor.id_capteurs }
  );

  if (existing.length > 0) return;

  const msg = `${sensor.name} hors seuil: ${value}${sensor.unite} (seuil ${sensor.seuil_min}-${sensor.seuil_max})`;

  await pool.query(
    `INSERT INTO alarmes (id_capteurs, niveau_gravite, message, date_heure, est_acquittee)
     VALUES (:id, :sev, :msg, NOW(), 0)`,
    { id: sensor.id_capteurs, sev, msg }
  );
}

/**
 * Démarre la simulation: tick toutes les 2 secondes.
 * Le lock évite d'avoir 2 ticks en même temps si la DB rame.
 */
function startSimulator() {
  console.log("[SIM] simulator started (tick=2s)");

  let running = false;

  setInterval(async () => {
    if (running) return;
    running = true;

    try {
      // 1) Récupérer les capteurs
      const [sensors] = await pool.query(
        "SELECT id_capteurs, name, unite, seuil_min, seuil_max FROM capteurs"
      );

      // 2) Pour chaque capteur: générer valeur -> insert mesure -> potentielle alarme
      for (const s of sensors) {
        const value = generateValue(s);
        await insertMeasurement(s.id_capteurs, value);
        await maybeCreateAlarm(s, value);
      }
    } catch (e) {
      console.error("[SIM] error:", e.message);
    } finally {
      running = false;
    }
  }, 2000);
}

module.exports = { startSimulator };

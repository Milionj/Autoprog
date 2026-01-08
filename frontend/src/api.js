/**
 * api.js
 * Objectif : centraliser les appels HTTP vers l’API (backend)
 * -> éviter de répéter fetch + headers + token partout.
 *
 * Important :
 * - On lit l'URL du backend depuis .env (VITE_API_URL)
 * - On ajoute automatiquement le header Authorization si un token existe
 * - On renvoie un message d’erreur clair si l’API répond en erreur
 */

const API_URL = import.meta.env.VITE_API_URL;

/**
 * getToken()
 * Rôle : récupérer le token JWT stocké dans le navigateur.
 * On l'a stocké au moment du login.
 */
export function getToken() {
  return localStorage.getItem("token");
}

/**
 * getRole()
 * Rôle : récupérer le rôle de l’utilisateur ("admin", "operator", "viewer")
 * C'est pratique pour afficher/masquer certains boutons côté UI.
 */
export function getRole() {
  return localStorage.getItem("role");
}

/**
 * logout()
 * Rôle : supprimer les infos de session locales.
 * Après ça, l'utilisateur redevient "non connecté".
 */
export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

/**
 * apiFetch(path, options)
 * Rôle : faire un appel API standardisé.
 *
 * - path : "/auth/login" ou "/alarms?acknowledged=false" etc.
 * - options : { method, body, headers... }
 *
 * Cette fonction :
 * 1) construit l'URL complète (API_URL + path)
 * 2) ajoute Content-Type JSON
 * 3) ajoute Authorization Bearer <token> si token existe
 * 4) tente de parser la réponse en JSON
 * 5) si HTTP status n'est pas OK -> throw Error(message)
 */
export async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,

    // headers par défaut : JSON + token
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  // On essaie de lire la réponse JSON (si l'API renvoie du JSON)
  const data = await res.json().catch(() => null);

  // Si la réponse est en erreur (ex: 401, 403, 500...)
  if (!res.ok) {
    // On récupère le message de l'API si possible
    const msg = data?.message || "Erreur serveur";
    throw new Error(msg);
  }

  // Sinon, tout est OK -> on renvoie le JSON
  return data;
}

import { Navigate } from "react-router-dom";

/**
 * RequireAuth
 * Rôle : empêcher l’accès au dashboard si pas connecté.
 *
 * - token présent -> on affiche children
 * - token absent -> on renvoie vers /login
 */
export default function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

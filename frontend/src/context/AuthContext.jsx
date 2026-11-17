// TODO(Jerith): add login(username, password) and register(...) here, wired to
// /api/auth. For now this loads the logged-in user (GET /api/auth/me returns
// 401 when logged out, which becomes user = null) and supports logout.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";
import { apiFetch } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () =>
      apiFetch("/auth/me")
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    apiFetch("/auth/me")
      .then((me) => !cancelled && setUser(me))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, setUser, refresh, logout }),
    [user, loading, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

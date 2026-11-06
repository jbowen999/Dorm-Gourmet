// TODO(Jerith): add login(username, password), register(...) and logout() here.
// The current version only loads the logged-in user so NavBar and the review
// pages can check `user`.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { apiFetch } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await apiFetch("/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

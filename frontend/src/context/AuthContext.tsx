import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react";
import Keycloak from "keycloak-js";

import type { AuthUser, UserRole } from "#src/types";
import { resetLang } from "#src/context/LanguageContext";
import { setAuthToken } from "#src/services/api";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const keycloak = new Keycloak({
  url: import.meta.env["VITE_KEYCLOAK_URL"] as string,
  realm: import.meta.env["VITE_KEYCLOAK_REALM"] as string,
  clientId: import.meta.env["VITE_KEYCLOAK_CLIENT_ID"] as string
});

let initPromise: Promise<boolean> | null = null;

function extractUser(kc: Keycloak): AuthUser | null {
  if (!kc.tokenParsed) return null;
  const parsed = kc.tokenParsed as Record<string, unknown>;
  const roles =
    (parsed["realm_access"] as { roles: string[] } | undefined)?.roles ?? [];
  let role: UserRole = "user";
  if (roles.includes("admin")) role = "admin";
  else if (roles.includes("operator")) role = "operator";
  return {
    id: parsed["sub"] as string,
    name: (parsed["name"] as string) ?? "",
    email: (parsed["email"] as string) ?? "",
    role
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!initPromise) {
      initPromise = keycloak.init({
        onLoad: "check-sso",
        checkLoginIframe: false,
        pkceMethod: "S256"
      });
    }

    initPromise
      .then((authenticated) => {
        if (authenticated && keycloak.token) {
          const u = extractUser(keycloak);
          setUser(u);
          setToken(keycloak.token);
          setAuthToken(keycloak.token);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30)
        .then((refreshed) => {
          if (refreshed && keycloak.token) {
            setToken(keycloak.token);
            setAuthToken(keycloak.token);
          }
        })
        .catch(() => {
          setUser(null);
          setToken(null);
          setAuthToken(null);
        });
    };
  }, []);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const logout = () => {
    resetLang();
    setUser(null);
    setToken(null);
    setAuthToken(null);
    keycloak.logout({ redirectUri: window.location.origin + "/login" });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { keycloak };

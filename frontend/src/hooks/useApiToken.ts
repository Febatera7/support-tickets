import { useEffect } from "react";
import { useAuth } from "#src/context/AuthContext";
import { setAuthToken } from "#src/services/api";

export function useApiToken() {
  const { token } = useAuth();
  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);
}

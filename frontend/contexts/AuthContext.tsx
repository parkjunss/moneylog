"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  apiGetProfile,
  apiLogin,
  apiLogout,
  apiReissue,
  setAccessTokenHandler,
  type UserProfile,
} from "@/lib/api-client";
import { decodeJwtRoles } from "@/lib/jwt";

type AuthContextValue = {
  accessToken: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setAccessTokenFromOAuth: (token: string) => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (token: string) => {
    const profile = await apiGetProfile(token);
    setUser(profile);
  }, []);

  useEffect(
    () =>
      setAccessTokenHandler((token) => {
        setAccessToken(token);
        if (!token) setUser(null);
      }),
    []
  );

  // 새로고침/최초 진입 시 httpOnly refresh token 쿠키로 세션을 복구한다.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const result = await apiReissue();
      if (cancelled) return;

      if (result?.accessToken) {
        setAccessToken(result.accessToken);
        try {
          await loadProfile(result.accessToken);
        } catch {
          setAccessToken(null);
        }
      }

      if (!cancelled) {
        setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await apiLogin({ email, password });
      setAccessToken(tokens.accessToken);
      await loadProfile(tokens.accessToken);
    },
    [loadProfile]
  );

  const setAccessTokenFromOAuth = useCallback(
    async (token: string) => {
      setAccessToken(token);
      await loadProfile(token);
    },
    [loadProfile]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        isLoading,
        isAuthenticated: Boolean(accessToken),
        isAdmin: Boolean(accessToken && decodeJwtRoles(accessToken).includes("ROLE_ADMIN")),
        login,
        logout,
        setAccessTokenFromOAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

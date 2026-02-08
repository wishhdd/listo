import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../api/client";
import type { User } from "../types";
import { AuthContext } from "./authContextInstance";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await api.post<User>("/api/auth/checkAuth", {});
        if (userData.message !== "User not found") {
          setUser(userData);
        }
      } catch (e) {
        console.warn(e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (loginStr: string, pass: string) => {
    const res = await api.post<User>("/api/auth/login", {
      login: loginStr,
      password: pass,
    });
    setUser(res);
  };

  const register = async (name: string, loginStr: string, pass: string) => {
    await api.post<User>("/api/auth/register", {
      userName: name,
      login: loginStr,
      password: pass,
    });
    await login(loginStr, pass);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout", {});
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

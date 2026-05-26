"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  clearStoredAuth,
  getStoredUser,
  getValidStoredToken,
  hasValidSession,
} from "@/lib/auth-token";

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  authReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readSessionFromStorage(): { token: string; user: User } | null {
  const token = getValidStoredToken();
  const user = getStoredUser();
  if (!token || !user) return null;
  return { token, user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    const session = readSessionFromStorage();
    if (session) {
      setToken(session.token);
      setUser(session.user);
    } else {
      setToken(null);
      setUser(null);
      clearStoredAuth();
    }
  }, []);

  useEffect(() => {
    syncFromStorage();
    setAuthReady(true);
  }, [syncFromStorage]);

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/proxy/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Erro ao fazer login");
    }

    const data = await response.json();
    const userData = { username: data.username, role: data.role };

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(userData));

    setToken(data.token);
    setUser(userData);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        authReady,
        login,
        logout,
        isAuthenticated: authReady && hasValidSession(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}

"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { clearStoredAuth, getValidStoredToken } from "@/lib/auth-token";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const storedToken = getValidStoredToken();
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        clearStoredAuth();
      }
    } else if (!storedToken) {
      clearStoredAuth();
    }

    setAuthReady(true);
  }, []);

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

    setToken(data.token);
    setUser(userData);

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(userData));
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
        isAuthenticated: authReady && !!token,
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

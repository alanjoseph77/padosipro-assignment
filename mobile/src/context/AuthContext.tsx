import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { api, setAuthToken, setUnauthorizedHandler, toApiError } from "../api/client";

const TOKEN_KEY = "padosipro_token";

export type Me = {
  id: string;
  email: string;
  profileCompleted: boolean;
  hasSelectedTasks: boolean;
  profile: { name: string; mobile: string; address: string; businessName: string | null } | null;
};

type Status = "loading" | "signedOut" | "signedIn" | "error";

type AuthValue = {
  status: Status;
  me: Me | null;
  bootError: string | null;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMe: () => Promise<void>;
  retry: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [me, setMe] = useState<Me | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setAuthToken(null);
    setMe(null);
    setStatus("signedOut");
  }, []);

  const refreshMe = useCallback(async () => {
    const res = await api.get<Me>("/me");
    setMe(res.data);
    setStatus("signedIn");
  }, []);

  // On app start: is there a saved token? If yes, check it's still valid
  const boot = useCallback(async () => {
    setStatus("loading");
    setBootError(null);
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) {
      setStatus("signedOut");
      return;
    }
    setAuthToken(token);
    try {
      await refreshMe();
    } catch (err) {
      const e = toApiError(err);
      if (e.status === 401) {
        await signOut();
      } else {
        setBootError(e.message);
        setStatus("error");
      }
    }
  }, [refreshMe, signOut]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut();
    });
    boot();
  }, [boot, signOut]);

  const signIn = useCallback(
    async (token: string) => {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      setAuthToken(token);
      await refreshMe();
    },
    [refreshMe]
  );

  return (
    <AuthContext.Provider value={{ status, me, bootError, signIn, signOut, refreshMe, retry: boot }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  clearToken,
  getProfile,
  login as apiLogin,
  register as apiRegister,
  RegisterData,
  setToken,
  User,
} from './api';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount — try to restore session
  useEffect(() => {
    (async () => {
      try {
        const result = await getProfile();
        setUser(result.user ?? (result as any));
      } catch {
        // Token missing / expired — stay logged out
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    await setToken(result.token);
    setTokenState(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setTokenState(null);
    setUser(null);
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const result = await apiRegister(data);
    await setToken(result.token);
    setTokenState(result.token);
    setUser(result.user);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getProfile();
      setUser(profile.user ?? (profile as any));
    } catch {
      await clearToken();
      setTokenState(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, register, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}

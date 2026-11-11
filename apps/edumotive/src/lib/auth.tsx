import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { account, AccountOutputType } from 'zitejs/api';

export type User = NonNullable<AccountOutputType['user']>;
const KEY = 'site.session';
export const getSession = () => localStorage.getItem(KEY) ?? undefined;

type Ctx = { user: User | null; isLoading: boolean; setSession: (token: string, user: User) => void; signOut: () => Promise<void>; refresh: () => Promise<void> };
const AuthCtx = createContext<Ctx>({ user: null, isLoading: true, setSession: () => {}, signOut: async () => {}, refresh: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const session = getSession();
    if (!session) { setUser(null); setLoading(false); return; }
    try {
      const r = await account({ action: 'me', session });
      if (!r.user) localStorage.removeItem(KEY);
      setUser(r.user ?? null);
    } catch { setUser(null); } finally { setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const setSession = (token: string, u: User) => { localStorage.setItem(KEY, token); setUser(u); };
  const signOut = async () => {
    const session = getSession();
    localStorage.removeItem(KEY); setUser(null);
    if (session) await account({ action: 'logout', session }).catch(() => {});
  };
  return <AuthCtx.Provider value={{ user, isLoading, setSession, signOut, refresh }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);

/** Send the visitor to the sign-in page, then back to where they were. */
export function loginWithRedirect() {
  const next = window.location.pathname + window.location.search;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

export async function logout() {
  const session = getSession();
  localStorage.removeItem(KEY);
  if (session) await account({ action: 'logout', session }).catch(() => {});
  window.location.assign('/');
}

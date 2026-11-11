import { useEffect, type ReactNode } from 'react';
import { useAuth, loginWithRedirect } from '../lib/auth';
import { Loader2 } from 'lucide-react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  useEffect(() => { if (!isLoading && !user) loginWithRedirect(); }, [isLoading, user]);
  if (isLoading || !user) return <div className="py-24 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  return <>{children}</>;
}

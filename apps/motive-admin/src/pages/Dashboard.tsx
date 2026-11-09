import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminStats } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { useAdmin } from '../lib/admin';

const CARDS: [string, string, string][] = [
  ['pending', 'Articles awaiting approval', '/articles'], ['published', 'Published articles', '/articles'],
  ['pendingSubs', 'Pending subscriptions', '/subscriptions'], ['activeSubs', 'Active subscribers', '/subscriptions'],
  ['issues', 'Magazine issues', '/issues'], ['programs', 'Programs', '/programs'],
  ['posts', 'UniMedia posts', '/unimedia'], ['members', 'Members', '/badges'],
];

export default function Dashboard() {
  const { token } = useAdmin();
  const { data, isLoading } = useQuery({ queryKey: ['stats'], queryFn: () => adminStats({ token }) });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl md:text-3xl font-bold">Welcome back 👋</h1><p className="text-muted-foreground">Here's what's happening at Edumotive.</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map(([k, label, to]) => (
          <Link key={k} to={to} className="glass p-5 hover:-translate-y-0.5 transition-transform">
            {isLoading ? <Skeleton className="h-9 w-16" /> : <p className="text-3xl md:text-4xl font-extrabold">{data?.stats[k] ?? 0}</p>}
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

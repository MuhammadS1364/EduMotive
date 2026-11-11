import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, LogOut, PenSquare, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { logout, getSession } from '../lib/auth';
import { getMyProfile, saveProfile } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Badge } from '@project/components/ui/badge';
import { Skeleton } from '@project/components/ui/skeleton';
import { formatDate } from '../lib/content';
import ImageUpload from '../components/ImageUpload';
import RequireAuth from '../components/RequireAuth';
import MyOrders from '../components/MyOrders';
import ThemeToggle from '../components/ThemeToggle';

export default function AccountPage() {
  return <RequireAuth><Account /></RequireAuth>;
}

function Account() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => getMyProfile({ session: getSession() }) });
  const [f, setF] = useState({ name: '', role: 'Student' as 'Student' | 'Author', class: '', institution: '', bio: '', avatar: '' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data?.profile) setF({ ...data.profile, role: data.profile.role === 'Author' ? 'Author' : 'Student' }); }, [data]);

  const save = async (override?: Partial<typeof f>) => {
    const v = { ...f, ...override };
    if (!v.name || !v.institution) { toast.error('Name and institution are required'); return; }
    setBusy(true);
    try { await saveProfile({ ...v, session: getSession() }); setF(v); await qc.invalidateQueries({ queryKey: ['me'] }); toast.success('Profile saved'); } catch { toast.error('Could not save'); } finally { setBusy(false); }
  };

  if (isLoading) return <div className="container mx-auto px-4 py-10 max-w-4xl"><Skeleton className="h-96" /></div>;
  const onboarding = !data?.profile;

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      <div className="glass p-6 md:p-8 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{onboarding ? 'Complete your profile' : 'My desk'}</h1>
            {!onboarding && <Badge className="mt-1">{f.role}</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={() => logout()}><LogOut className="h-4 w-4" />Sign out</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Full name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Class *</Label><Input value={f.class} placeholder="e.g. Degree 2nd year" onChange={(e) => setF({ ...f, class: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Institution *</Label><Input value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Short bio</Label><Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Photo</Label><ImageUpload value={f.avatar} onChange={(avatar) => setF({ ...f, avatar })} /></div>
          {onboarding && (
            <div className="space-y-1.5"><Label>I am joining as</Label>
              <div className="flex gap-2">{(['Student', 'Author'] as const).map((r) => <Button key={r} type="button" variant={f.role === r ? 'default' : 'outline'} onClick={() => setF({ ...f, role: r })}>{r}</Button>)}</div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => save()}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save profile</Button>
          {!onboarding && f.role === 'Student' && <Button variant="secondary" disabled={busy} onClick={() => save({ role: 'Author' })}><Sparkles className="h-4 w-4" />Become an author</Button>}
        </div>
      </div>

      <div className="glass p-6 flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">Settings</h2><p className="text-sm text-muted-foreground">Appearance — light, system or dark</p></div>
        <ThemeToggle />
      </div>

      {!onboarding && (
        <div className="glass p-6 md:p-8 space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">My submissions</h2><Button asChild size="sm"><Link to="/write"><PenSquare className="h-4 w-4" />New</Link></Button></div>
          {data!.articles.length === 0 ? <p className="text-muted-foreground">You haven't submitted anything yet.</p> : (
            <ul className="divide-y">
              {data!.articles.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0"><p className="font-semibold truncate">{a.title}</p><p className="text-xs text-muted-foreground">{formatDate(a.created)}</p></div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={a.status === 'Published' ? 'default' : a.status === 'Rejected' ? 'destructive' : 'outline'}>{a.status === 'Pending' ? 'Awaiting approval' : a.status}</Badge>
                    {a.status === 'Published' ? <Button asChild variant="ghost" size="sm"><Link to={`/articles/${a.id}`}>View</Link></Button>
                      : <Button asChild variant="ghost" size="sm"><Link to={`/write/${a.id}`}>Edit</Link></Button>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {!onboarding && <MyOrders />}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart, Loader2, MessageCircle, Camera, Grid3x3, LogOut, Settings, ExternalLink, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useUpload } from 'zitejs/upload';
import { logout } from 'zitejs/auth';
import { profile as profileApi } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Label } from '@project/components/ui/label';
import { Badge } from '@project/components/ui/badge';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@project/components/ui/dialog';
import ThemeToggle from '../components/ThemeToggle';

export const EDUMOTIVE_URL = 'https://edumotiveonline.zite.so/';

export default function ProfilePage() {
  const { id } = useParams();
  const { data, isLoading, refetch } = useQuery({ queryKey: ['profile', id ?? 'me'], queryFn: () => profileApi({ userId: id }) });
  const [edit, setEdit] = useState(false);
  useEffect(() => { if (data?.isMe && !data.profile) setEdit(true); }, [data]);
  if (isLoading || !data) return <Skeleton className="h-72 rounded-3xl" />;
  const p = data.profile;
  const likes = data.posts.reduce((n, x) => n + x.likes, 0);
  return (
    <div className="space-y-5">
      <div className="glass relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
        <div className="relative flex items-center gap-5">
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full p-[3px] bg-gradient-to-tr from-primary via-accent to-secondary shrink-0">
            <div className="h-full w-full rounded-full overflow-hidden bg-muted flex items-center justify-center text-3xl font-bold border-2 border-card">
              {p?.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" /> : (p?.name ?? '?')[0]}
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 text-center">
            <div><p className="text-2xl font-extrabold">{data.posts.length}</p><p className="text-xs text-muted-foreground">Posts</p></div>
            <div><p className="text-2xl font-extrabold">{likes}</p><p className="text-xs text-muted-foreground">Likes</p></div>
          </div>
        </div>
        <div className="relative mt-4 space-y-1">
          <div className="flex items-center gap-2"><p className="font-bold text-lg">{p?.name || 'New member'}</p>{p?.role && <Badge variant="secondary">{p.role}</Badge>}</div>
          {(p?.class || p?.institution) && <p className="text-sm text-primary font-semibold">{[p?.class, p?.institution].filter(Boolean).join(' · ')}</p>}
          {p?.bio && <p className="text-sm whitespace-pre-line">{p.bio}</p>}
        </div>
        {data.isMe && <div className="relative flex gap-2 mt-4"><Button variant="secondary" className="flex-1" onClick={() => setEdit(true)}>Edit profile</Button><Button variant="outline" size="icon" onClick={() => logout()}><LogOut className="h-4 w-4" /></Button></div>}
      </div>
      {data.isMe && (
        <div className="glass p-5 space-y-4">
          <p className="flex items-center gap-2 font-bold"><Settings className="h-4 w-4" />Settings</p>
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">Appearance</p><p className="text-xs text-muted-foreground">Light, system or dark</p></div><ThemeToggle /></div>
          <a href={EDUMOTIVE_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-sm font-semibold hover:text-primary">Visit EduMotive <ExternalLink className="h-4 w-4" /></a>
        </div>
      )}
      <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"><Grid3x3 className="h-4 w-4" />Posts</div>
      {data.posts.length === 0 ? <p className="text-center text-muted-foreground py-10">No posts yet.</p> : <PostGrid posts={data.posts} />}
      {data.isMe && <EditProfile open={edit} onOpenChange={setEdit} initial={p} onSaved={refetch} />}
    </div>
  );
}

export function PostGrid({ posts }: { posts: { id: string; image: string; video?: boolean; likes: number; comments: number }[] }) {
  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2">
      {posts.map((x) => (
        <Link key={x.id} to={`/p/${x.id}`} className="group relative aspect-square overflow-hidden rounded-xl bg-muted">
          {x.video ? <><video src={x.image} muted playsInline preload="metadata" className="h-full w-full object-cover" /><Play className="absolute top-2 right-2 h-4 w-4 fill-white text-white drop-shadow" /></>
            : <img src={x.image} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />}
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white text-sm font-bold">
            <span className="flex items-center gap-1"><Heart className="h-4 w-4 fill-white" />{x.likes}</span><span className="flex items-center gap-1"><MessageCircle className="h-4 w-4 fill-white" />{x.comments}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

type P = { name: string; institution: string; class: string; bio: string; avatar: string; role: string } | null;
function EditProfile({ open, onOpenChange, initial, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; initial: P; onSaved: () => void }) {
  const [f, setF] = useState({ name: '', institution: '', class: '', bio: '', avatar: '', ...(initial ?? {}), role: initial?.role === 'Author' ? 'Author' as const : 'Student' as const });
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const save = async () => {
    if (!f.name.trim() || !f.class.trim() || !f.institution.trim()) { toast.error('Name, class and institution are required'); return; }
    setBusy(true);
    try { await profileApi({ save: f }); toast.success('Profile saved'); onOpenChange(false); onSaved(); } catch { toast.error('Could not save'); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{initial ? 'Edit profile' : 'Complete your profile'}</DialogTitle><DialogDescription>Your profile is shared with EduMotive.</DialogDescription></DialogHeader>
        <button onClick={() => ref.current?.click()} className="mx-auto h-24 w-24 rounded-full bg-muted overflow-hidden flex items-center justify-center ring-2 ring-primary/40">
          {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : f.avatar ? <img src={f.avatar} alt="" className="h-full w-full object-cover" /> : <Camera className="h-7 w-7 text-muted-foreground" />}
        </button>
        <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; try { setF({ ...f, avatar: (await upload(file)).url }); } catch { toast.error('Upload failed'); } }} />
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Full name *</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Class *</Label><Input value={f.class} placeholder="e.g. Degree 2nd year" onChange={(e) => setF({ ...f, class: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Institution *</Label><Input value={f.institution} onChange={(e) => setF({ ...f, institution: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Short bio</Label><Textarea rows={3} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
          {!initial && (
            <div className="space-y-1.5"><Label>I am joining as</Label>
              <div className="flex gap-2">{(['Student', 'Author'] as const).map((r) => <Button key={r} type="button" variant={f.role === r ? 'default' : 'outline'} onClick={() => setF({ ...f, role: r })}>{r}</Button>)}</div>
            </div>
          )}
        </div>
        <DialogFooter><Button className="w-full" disabled={busy || isUploading} onClick={save}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save profile</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

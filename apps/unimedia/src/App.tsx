import { useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Home, LayoutGrid, PlusSquare, User, Search } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth, loginWithRedirect, getSession } from './lib/auth';
import { AuthProvider } from './lib/auth';
import LoginPage from './pages/LoginPage';
import { getFeed } from 'zitejs/api';
import { Toaster } from '@project/components/ui/sonner';
import { Input } from '@project/components/ui/input';
import { Skeleton } from '@project/components/ui/skeleton';
import { cn } from '@project/components/lib/utils';
import PostCard from './components/PostCard';
import NewPost from './components/NewPost';
import StoriesBar from './components/StoriesBar';
import ProfilePage, { PostGrid, EDUMOTIVE_URL } from './pages/ProfilePage';

const qc = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });
const useFeed = () => useQuery({ queryKey: ['feed'], queryFn: () => getFeed({ session: getSession() }) });

function Feed() {
  const { data, isLoading, refetch } = useFeed();
  const bar = <StoriesBar />;
  if (isLoading) return <>{bar}{[0, 1].map((i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}</>;
  if (!data?.posts.length) return <>{bar}<div className="glass p-10 text-center space-y-2"><p className="text-xl font-bold">No posts yet</p><p className="text-muted-foreground">Share a moment from your campus.</p></div></>;
  return <>{bar}{data.posts.map((p) => <PostCard key={p.id + p.likes + p.comments.length} post={p} refresh={refetch} />)}</>;
}

function Campus() {
  const { data, isLoading } = useFeed();
  const [q, setQ] = useState('');
  const posts = (data?.posts ?? []).filter((p) => !q || `${p.institution} ${p.authorName} ${p.caption}`.toLowerCase().includes(q.toLowerCase()));
  const campuses = Array.from(new Set((data?.posts ?? []).map((p) => p.institution).filter(Boolean)));
  return (
    <div className="space-y-4">
      <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search campus, people, captions" className="pl-9 rounded-full bg-card/70" /></div>
      {campuses.length > 0 && <div className="flex gap-2 overflow-x-auto scrollbar-none">{campuses.map((c) => <button key={c} onClick={() => setQ(q === c ? '' : c)} className={cn('shrink-0 rounded-full border px-3 py-1 text-xs font-semibold', q === c ? 'bg-secondary text-secondary-foreground' : 'bg-card/60')}>{c}</button>)}</div>}
      {isLoading ? <Skeleton className="h-72" /> : <PostGrid posts={posts.map((p) => ({ id: p.id, image: p.image, video: p.mediaType === 'Video', likes: p.likes, comments: p.comments.length }))} />}
    </div>
  );
}

function SinglePost() {
  const { id } = useParams();
  const { data, refetch } = useFeed();
  const post = data?.posts.find((p) => p.id === id);
  if (!data) return <Skeleton className="aspect-square rounded-2xl" />;
  return post ? <PostCard key={post.id + post.likes + post.comments.length} post={post} refresh={refetch} /> : <p className="text-center text-muted-foreground py-10">Post not found.</p>;
}

function Shell() {
  const [open, setOpen] = useState(false);
  const { refetch } = useFeed();
  const tab = ({ isActive }: { isActive: boolean }) => cn('flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-[10px] font-semibold transition-colors', isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground');
  return (
    <div className="min-h-screen">
      <header className="glass-bar sticky top-0 z-30">
        <div className="max-w-xl mx-auto flex items-center gap-3 px-4 py-3">
          <span className="font-display text-3xl tracking-tight">Uni<span className="text-primary">Media</span></span>
          <span className="ml-auto text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Campus life</span>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-3 py-5 space-y-5 pb-28">
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/campus" element={<Campus />} />
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/u/:id" element={<ProfilePage />} />
          <Route path="/p/:id" element={<SinglePost />} />
          <Route path="*" element={<Feed />} />
        </Routes>
        <p className="text-center text-xs text-muted-foreground pt-6">UniMedia · Powered by <a href={EDUMOTIVE_URL} target="_blank" rel="noreferrer" className="font-semibold text-foreground hover:text-primary">EduMotive</a></p>
      </main>
      <nav className="fixed bottom-3 inset-x-0 z-30 flex justify-center px-4">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-3xl border border-white/25 bg-card/50 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]">
          <NavLink to="/" end className={tab}><Home className="h-5 w-5" />Home</NavLink>
          <NavLink to="/campus" className={tab}><LayoutGrid className="h-5 w-5" />Campus</NavLink>
          <button onClick={() => setOpen(true)} className="flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground"><PlusSquare className="h-5 w-5" />Post</button>
          <NavLink to="/me" className={tab}><User className="h-5 w-5" />Profile</NavLink>
        </div>
      </nav>
      <NewPost open={open} onOpenChange={setOpen} onDone={() => { refetch(); qc.invalidateQueries({ queryKey: ['profile'] }); }} />
    </div>
  );
}

function Gate() {
  const { user, isLoading } = useAuth();
  useEffect(() => { if (!isLoading && !user) loginWithRedirect(); }, [isLoading, user]);
  if (window.location.pathname === '/login') return <LoginPage />;
  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading UniMedia…</div>;
  return <BrowserRouter><Shell /></BrowserRouter>;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={qc}><AuthProvider><Gate /></AuthProvider><Toaster /></QueryClientProvider>
    </ThemeProvider>
  );
}

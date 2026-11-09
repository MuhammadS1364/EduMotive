import { useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Award, BookOpen, CalendarRange, CreditCard, FileText, Image, LayoutDashboard, Layers, Loader2, LogOut, StickyNote, Trophy, Users, Settings, Megaphone, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { adminLogin } from 'zitejs/api';
import { Toaster } from '@project/components/ui/sonner';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { cn } from '@project/components/lib/utils';
import { AdminCtx } from './lib/admin';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './pages/Dashboard';
import ArticlesAdmin from './pages/ArticlesAdmin';
import SubscriptionsAdmin from './pages/SubscriptionsAdmin';
import BadgesAdmin from './pages/BadgesAdmin';
import UniMediaAdmin from './pages/UniMediaAdmin';
import PlannerAdmin from './pages/PlannerAdmin';
import { SectionsAdmin, IssuesAdmin, AboutAdmin, ProgramsAdmin, ResultsAdmin, NotesAdmin, SiteAdmin, AuthorsAdmin } from './pages/ConfigPages';

export const LOGO_URL = 'https://images.fillout.com/orgid-886933/flowpublicid-g9mcbthowz/widgetid-default/vJUKs187fWTMbvnC9QkcLg/pasted-image-1791520031939-sk6cjd3r.png';
const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

const NAV = [
  ['/', 'Dashboard', LayoutDashboard], ['/articles', 'Articles', FileText], ['/authors', 'Authors', PenLine], ['/sections', 'Sections', Layers],
  ['/issues', 'Magazine', BookOpen], ['/badges', 'Badges', Award], ['/subscriptions', 'Subscriptions', CreditCard],
  ['/programs', 'Programs', Megaphone], ['/results', 'Results', Trophy], ['/about', 'About & Team', Users],
  ['/unimedia', 'UniMedia', Image], ['/notes', 'Notes', StickyNote], ['/planner', 'Planner', CalendarRange], ['/settings', 'Contact', Settings],
] as const;

function Logo() {
  return <span className="inline-block aspect-[3.4/1] overflow-hidden h-10 "><img src={LOGO_URL} alt="Edumotive" className="logo-img h-full w-full object-cover" /></span>;
}

function Login({ onLogin }: { onLogin: (t: string) => void }) {
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { onLogin((await adminLogin({ username: u, password: p })).token); }
    catch { toast.error('Incorrect username or password'); } finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="liquid-bg"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
      <form onSubmit={submit} className="glass p-8 w-full max-w-sm space-y-5">
        <div className="text-center space-y-3"><Logo /><h1 className="text-xl font-bold">Admin panel</h1></div>
        <div className="space-y-1.5"><Label>Username</Label><Input value={u} onChange={(e) => setU(e.target.value)} autoFocus /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={p} onChange={(e) => setP(e.target.value)} /></div>
        <Button className="w-full" disabled={!u || !p || busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in</Button>
      </form>
    </div>
  );
}

function Shell({ logout }: { logout: () => void }) {
  const link = ({ isActive }: { isActive: boolean }) => cn('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted');
  return (
    <div className="min-h-screen relative">
      <div className="liquid-bg"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-60 flex-col glass !rounded-none !border-y-0 !border-l-0 p-4 gap-1 overflow-y-auto">
        <div className="mb-4"><Logo /></div>
        {NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} className={link}><Icon className="h-4 w-4" />{label}</NavLink>)}
        <div className="mt-auto flex items-center gap-2 pt-4"><ThemeToggle /><Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" />Sign out</Button></div>
      </aside>
      <header className="lg:hidden sticky top-0 z-30 glass-bar">
        <div className="flex items-center justify-between px-4 py-2"><Logo /><div className="flex items-center gap-1"><ThemeToggle /><Button size="icon" variant="ghost" onClick={logout}><LogOut className="h-4 w-4" /></Button></div></div>
        <nav className="flex gap-1 overflow-x-auto scrollbar-none px-3 pb-2">{NAV.map(([to, label, Icon]) => <NavLink key={to} to={to} end={to === '/'} className={link}><Icon className="h-4 w-4" />{label}</NavLink>)}</nav>
      </header>
      <main className="lg:pl-60"><div className="max-w-6xl mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/articles" element={<ArticlesAdmin />} />
          <Route path="/authors" element={<AuthorsAdmin />} />
          <Route path="/sections" element={<SectionsAdmin />} />
          <Route path="/issues" element={<IssuesAdmin />} />
          <Route path="/badges" element={<BadgesAdmin />} />
          <Route path="/subscriptions" element={<SubscriptionsAdmin />} />
          <Route path="/programs" element={<ProgramsAdmin />} />
          <Route path="/results" element={<ResultsAdmin />} />
          <Route path="/about" element={<AboutAdmin />} />
          <Route path="/unimedia" element={<UniMediaAdmin />} />
          <Route path="/notes" element={<NotesAdmin />} />
          <Route path="/planner" element={<PlannerAdmin />} />
          <Route path="/settings" element={<SiteAdmin />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </div></main>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('em_admin') ?? '');
  const login = (t: string) => { localStorage.setItem('em_admin', t); setToken(t); };
  const logout = () => { localStorage.removeItem('em_admin'); setToken(''); };
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={qc}>
        <AdminCtx.Provider value={{ token, logout }}>
          {token ? <BrowserRouter><Shell logout={logout} /></BrowserRouter> : <Login onLogin={login} />}
        </AdminCtx.Provider>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

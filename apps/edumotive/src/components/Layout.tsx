import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, PenSquare, Search, User } from 'lucide-react';
import { useAuth, loginWithRedirect } from 'zitejs/auth';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';
import Footer from './Footer';
import { LOGO_URL, useContent, slugify } from '../lib/content';

export default function Layout() {
  const { user } = useAuth();
  const { data } = useContent();
  const [q, setQ] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);

  const s = data?.settings ?? {};
  const links: [string, string][] = [
    ['/', 'Home'],
    ['/articles', 'Articles'], ['/authors', 'Authors'], ['/issues', 'Magazine'],
    ...(s.showPrograms !== 'false' ? [['/programs', 'Programs'] as [string, string]] : []),
    ...(s.showResults !== 'false' ? [['/results', 'Results'] as [string, string]] : []),
    ...(s.showSubscribe !== 'false' ? [['/subscribe', 'Subscribe'] as [string, string]] : []),
    ['/news', 'News'], ['/about', 'About Us'], ['/contact', 'Join & Contact'],
  ];

  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="liquid-bg"><div className="blob b1" /><div className="blob b2" /><div className="blob b3" /></div>
      <div className="bg-secondary text-secondary-foreground text-xs">
        <div className="container mx-auto px-4 h-8 flex items-center justify-between">
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          <span className="hidden sm:inline opacity-80">Darul Huda Islamic University · Chemmad, Kerala</span>
        </div>
      </div>
      <header className="glass-bar sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center shrink-0">
            <span className="inline-block aspect-[3.4/1] overflow-hidden h-11 md:h-14">
              <img src={LOGO_URL} alt="Edumotive" className="logo-img w-full h-full object-cover object-center" draggable={false} />
            </span>
          </Link>
          <form onSubmit={(e) => { e.preventDefault(); nav(`/articles?q=${encodeURIComponent(q)}`); }}
            className="ml-auto hidden md:flex items-center gap-2 rounded-full border bg-background/50 px-3 h-10 w-64">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" className="bg-transparent outline-none text-sm flex-1 min-w-0" />
          </form>
          <div className="ml-auto md:ml-0 flex items-center gap-2">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => nav('/articles')} aria-label="Search"><Search className="h-5 w-5" /></Button>
            {user ? (
              <Button size="sm" className="rounded-full font-semibold" onClick={() => nav('/account')}><User className="h-4 w-4" /><span className="hidden sm:inline">My desk</span></Button>
            ) : (
              <Button size="sm" className="rounded-full font-semibold" onClick={() => loginWithRedirect()}>Sign in</Button>
            )}
          </div>
        </div>
        <nav className="border-t border-border/60 relative">
          <div className="container mx-auto px-2 flex items-center gap-1 overflow-x-auto scrollbar-none snap-x lg:justify-center">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => cn('snap-start whitespace-nowrap px-3 py-2.5 text-[12.5px] font-bold uppercase tracking-wider border-b-2 transition-colors',
                  isActive ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}>
                {label}
              </NavLink>
            ))}
          </div>
                  </nav>
        {(loc.pathname.startsWith('/articles') || loc.pathname.startsWith('/section')) && (data?.sections.length ?? 0) > 0 && (
          <div className="border-t border-border/60">
            <div className="container mx-auto px-3 py-2 flex gap-2 overflow-x-auto scrollbar-none lg:justify-center">
              <NavLink to="/articles" end className={({ isActive }) => cn('shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold border transition-colors', isActive ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-card/60 hover:border-primary')}>All</NavLink>
              {data!.sections.map((x) => (
                <NavLink key={x.id} to={`/section/${slugify(x.name)}`} className={({ isActive }) => cn('shrink-0 rounded-full px-3.5 py-1 text-xs font-semibold border transition-colors', isActive ? 'bg-secondary text-secondary-foreground border-secondary' : 'bg-card/60 hover:border-primary')}>{x.name}</NavLink>
              ))}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-2">
        {loc.pathname !== '/' && (
          <Button size="icon" className="rounded-full shadow-lg h-12 w-12" onClick={() => nav('/')} title="Go to home"><Home className="h-5 w-5" /></Button>
        )}
        {user && (
          <Button size="icon" variant="secondary" className="rounded-full shadow-lg h-12 w-12" onClick={() => nav('/write')} title="Write"><PenSquare className="h-5 w-5" /></Button>
        )}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@project/components/ui/skeleton';
import { Button } from '@project/components/ui/button';
import { useContent, formatDate, slugify, ArticleSummary } from '../lib/content';
import ArticleCard from '../components/ArticleCard';

function Hero({ a }: { a: ArticleSummary }) {
  return (
    <Link to={`/articles/${a.id}`} className="group relative block overflow-hidden rounded-2xl lg:col-span-2 h-[380px] md:h-[460px] bg-muted shadow-xl">
      {a.coverImage && <img src={a.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute bottom-0 p-6 md:p-10 text-white space-y-3">
        <span className="inline-block rounded-full bg-accent text-accent-foreground px-3 py-1 text-[11px] font-bold uppercase tracking-widest">{a.section || 'Featured'}</span>
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight max-w-3xl">{a.title}</h1>
        <p className="hidden md:block text-white/80 max-w-2xl line-clamp-2">{a.excerpt}</p>
        <p className="text-sm text-white/70">By {a.authorName} · {formatDate(a.publishedAt)}</p>
      </div>
    </Link>
  );
}

function SideCard({ a }: { a: ArticleSummary }) {
  return (
    <Link to={`/articles/${a.id}`} className="group relative block overflow-hidden rounded-2xl h-56 md:h-[220px] bg-muted shadow-lg">
      {a.coverImage && <img src={a.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute bottom-0 p-5 text-white space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-accent">{a.section}</span>
        <h3 className="text-lg font-bold leading-snug line-clamp-2">{a.title}</h3>
        <p className="text-xs text-white/70">{a.authorName}</p>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { data, isLoading } = useContent();
  if (isLoading || !data) {
    return <div className="container mx-auto px-4 py-8 grid gap-5 lg:grid-cols-3"><Skeleton className="h-[460px] lg:col-span-2" /><div className="flex flex-col gap-5"><Skeleton className="h-56" /><Skeleton className="h-56" /></div></div>;
  }
  const hero = data.articles.find((a) => a.featured) ?? data.articles[0];
  const side = data.articles.filter((a) => a.id !== hero?.id).slice(0, 2);
  const latest = data.articles.filter((a) => a.id !== hero?.id && !side.includes(a)).slice(0, 6);
  const issue = data.issues[0];

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 space-y-14 max-w-7xl">
      {hero ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid gap-5 lg:grid-cols-3">
          <Hero a={hero} />
          <div className="flex flex-col gap-5">{side.map((a) => <SideCard key={a.id} a={a} />)}</div>
        </motion.div>
      ) : (
        <div className="glass p-12 text-center space-y-3">
          <h1 className="text-4xl font-extrabold">Welcome to Edumotive</h1>
          <p className="text-muted-foreground">The first stories are on their way. Be among the first to write for us.</p>
          <Button asChild><Link to="/write">Submit your work</Link></Button>
        </div>
      )}

      {latest.length > 0 && (
        <section className="space-y-5">
          <Title title="Latest" to="/articles" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{latest.map((a) => <ArticleCard key={a.id} a={a} />)}</div>
        </section>
      )}

      {data.sections.map((s) => {
        const list = data.articles.filter((a) => a.section === s.name).slice(0, 4);
        if (!list.length) return null;
        return (
          <section key={s.id} className="space-y-5">
            <Title title={s.name} to={`/section/${slugify(s.name)}`} />
            <div className="flex gap-5 overflow-x-auto scrollbar-none snap-x pb-2 md:grid md:grid-cols-4 md:overflow-visible">
              {list.map((a) => <div key={a.id} className="snap-start shrink-0 w-[78%] sm:w-[45%] md:w-auto"><ArticleCard a={a} /></div>)}
            </div>
          </section>
        );
      })}

      {issue && (
        <section className="glass p-6 md:p-10 grid md:grid-cols-[220px_1fr] gap-8 items-center">
          <Link to={`/issues/${issue.id}`} className="mx-auto w-44 md:w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted shadow-2xl flex items-center justify-center">
            {issue.coverImage ? <img src={issue.coverImage} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-10 w-10 text-muted-foreground" />}
          </Link>
          <div className="space-y-3 text-center md:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Latest issue</p>
            <h2 className="text-3xl md:text-4xl font-bold">{issue.title}</h2>
            <p className="text-muted-foreground">{issue.description}</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <Button asChild className="rounded-full"><Link to={`/issues/${issue.id}`}>Read now <ArrowRight className="h-4 w-4" /></Link></Button>
              {data.settings.showSubscribe !== 'false' && <Button asChild variant="outline" className="rounded-full"><Link to="/subscribe">Get print copy</Link></Button>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Title({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-end justify-between border-b-2 border-foreground/80 pb-2">
      <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      <Link to={to} className="text-sm font-semibold hover:text-primary">View all →</Link>
    </div>
  );
}

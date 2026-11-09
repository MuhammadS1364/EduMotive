import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Skeleton } from '@project/components/ui/skeleton';
import { Button } from '@project/components/ui/button';
import { formatDate, useContent } from '../lib/content';
import AuthorBadges from '../components/AuthorBadges';

export default function AuthorPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useContent();
  if (isLoading) return <div className="container mx-auto px-4 py-10"><Skeleton className="h-72" /></div>;
  const a = data?.authors.find((x) => x.id === id);
  if (!a) return <div className="text-center py-24">Author not found. <Link to="/authors" className="text-primary underline">All authors</Link></div>;
  const list = data!.articles.filter((x) => x.authorId === id);
  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-10">
      <Button asChild variant="ghost" size="sm"><Link to="/authors"><ArrowLeft className="h-4 w-4" />All authors</Link></Button>
      <div className="glass relative overflow-hidden">
        <div className="h-32 md:h-40 bg-gradient-to-r from-primary/60 via-accent/50 to-secondary/40" />
        <div className="px-6 md:px-10 pb-8 -mt-16 flex flex-col md:flex-row md:items-end gap-6">
          <div className="h-32 w-32 md:h-36 md:w-36 shrink-0 rounded-full p-1 bg-gradient-to-tr from-primary to-accent shadow-2xl">
            <div className="h-full w-full rounded-full overflow-hidden bg-muted border-4 border-card flex items-center justify-center text-4xl font-bold font-serif">{a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : a.name[0]}</div>
          </div>
          <div className="flex-1 space-y-2">
            {a.designation && <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{a.designation}</p>}
            <h1 className="text-4xl md:text-5xl font-extrabold">{a.name}</h1>
            <p className="text-muted-foreground">{[a.class, a.institution].filter(Boolean).join(' · ')}</p>
            <AuthorBadges badges={a.badges} showLabel />
          </div>
          <div className="flex gap-6 md:text-right">
            <div><p className="text-3xl font-black font-serif">{list.length}</p><p className="text-xs uppercase tracking-wider text-muted-foreground">Articles</p></div>
            <div><p className="text-3xl font-black font-serif">{a.badges.length}</p><p className="text-xs uppercase tracking-wider text-muted-foreground">Badges</p></div>
          </div>
        </div>
        {a.bio && <p className="px-6 md:px-10 pb-8 max-w-3xl leading-relaxed text-muted-foreground">{a.bio}</p>}
      </div>
      <section className="space-y-4">
        <h2 className="text-3xl font-bold border-b pb-3">Articles by {a.name.split(' ')[0]}</h2>
        {list.length === 0 ? <p className="text-muted-foreground py-6 flex items-center gap-2"><BookOpen className="h-4 w-4" />No published articles yet.</p> : (
          <ul className="divide-y">
            {list.map((x) => (
              <li key={x.id}>
                <Link to={`/articles/${x.id}`} className="group grid sm:grid-cols-[240px_1fr] gap-5 py-6">
                  <div className="overflow-hidden rounded-xl bg-muted aspect-[16/10]">{x.coverImage && <img src={x.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}</div>
                  <div className="space-y-2">
                    {x.section && <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{x.section}</p>}
                    <h3 className="text-2xl font-bold leading-snug group-hover:text-primary transition-colors">{x.title}</h3>
                    {x.excerpt && <p className="text-muted-foreground line-clamp-2">{x.excerpt}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(x.publishedAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

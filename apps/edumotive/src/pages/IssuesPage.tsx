import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { cn } from '@project/components/lib/utils';
import { useContent, formatDate } from '../lib/content';

export default function IssuesPage() {
  const { data, isLoading } = useContent();
  const [idx, setIdx] = useState(0);
  if (isLoading) return <div className="container mx-auto px-4 py-10"><Skeleton className="h-[480px]" /></div>;
  const issues = data?.issues ?? [];
  if (!issues.length) return <p className="text-center text-muted-foreground py-24">No issues published yet.</p>;
  const cur = issues[idx];

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
      <div className="text-center"><h1 className="text-4xl md:text-5xl font-extrabold">Magazine</h1></div>
      <section className="glass p-6 md:p-10 grid md:grid-cols-[300px_1fr] gap-8 items-center">
        <Link to={`/issues/${cur.id}`} className="mx-auto w-56 md:w-full aspect-[3/4] rounded-lg overflow-hidden bg-muted shadow-2xl flex items-center justify-center">
          {cur.coverImage ? <img src={cur.coverImage} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-12 w-12 text-muted-foreground" />}
        </Link>
        <div className="space-y-4 text-center md:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">{idx === 0 ? 'Latest issue' : 'Past issue'} · {formatDate(cur.issueDate)}</p>
          <h2 className="text-3xl md:text-5xl font-bold">{cur.title}</h2>
          {cur.description && <p className="text-muted-foreground">{cur.description}</p>}
          <Button asChild size="lg" className="rounded-full"><Link to={`/issues/${cur.id}`}>Read this issue</Link></Button>
          <div className="flex justify-center md:justify-start gap-2 pt-2">
            <Button variant="outline" disabled={idx >= issues.length - 1} onClick={() => setIdx(idx + 1)}><ChevronLeft className="h-4 w-4" />Previous issue</Button>
            <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Next issue<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </section>
      {issues.length > 1 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold border-b-2 border-foreground/80 pb-2">Archive</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x pb-2">
            {issues.map((i, n) => (
              <button key={i.id} onClick={() => { setIdx(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={cn('snap-start shrink-0 w-32 md:w-40 text-center space-y-2', n === idx && 'opacity-100', n !== idx && 'opacity-75 hover:opacity-100')}>
                <div className={cn('aspect-[3/4] rounded-lg overflow-hidden bg-muted flex items-center justify-center', n === idx && 'ring-4 ring-primary')}>
                  {i.coverImage ? <img src={i.coverImage} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-6 w-6 text-muted-foreground" />}
                </div>
                <p className="text-sm font-semibold line-clamp-1">{i.title}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(i.issueDate)}</p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

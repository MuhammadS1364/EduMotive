import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { cn } from '@project/components/lib/utils';
import { useContent } from '../lib/content';
import ArticleCard from '../components/ArticleCard';

const PAGE = 9;

export default function ArticlesPage() {
  const { data, isLoading } = useContent();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [section, setSection] = useState('All');
  const [count, setCount] = useState(PAGE);

  const sections = useMemo(() => ['All', ...(data?.sections ?? []).map((s) => s.name)], [data]);
  const list = useMemo(() => (data?.articles ?? []).filter((a) =>
    (section === 'All' || a.section === section) &&
    (!q || `${a.title} ${a.excerpt} ${a.authorName}`.toLowerCase().includes(q.toLowerCase()))), [data, q, section]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold">Articles</h1>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {})} placeholder="Search by title, topic or author" className="pl-9 rounded-full bg-background/60" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none md:flex-wrap md:justify-center pb-1">
          {sections.map((s) => (
            <button key={s} onClick={() => { setSection(s); setCount(PAGE); }}
              className={cn('shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors', section === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50 hover:bg-muted')}>
              {s}
            </button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-72" />)}</div>
      ) : list.length === 0 ? (
        <p className="text-center text-muted-foreground py-16">No articles found.</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{list.slice(0, count).map((a) => <ArticleCard key={a.id} a={a} />)}</div>
          {count < list.length && <div className="text-center"><Button variant="outline" onClick={() => setCount(count + PAGE)}>Load more</Button></div>}
        </>
      )}
    </div>
  );
}

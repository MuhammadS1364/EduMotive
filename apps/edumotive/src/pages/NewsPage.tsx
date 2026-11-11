import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Newspaper, Pin, Search } from 'lucide-react';
import { getNews, GetNewsOutputType } from 'zitejs/api';
import { Input } from '@project/components/ui/input';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle } from '@project/components/ui/dialog';
import { cn } from '@project/components/lib/utils';
import MarkdownArticle from '../components/MarkdownArticle';
import { formatDate } from '../lib/content';

type News = GetNewsOutputType['news'][0];
const isVideo = (u: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(u);

function Media({ url, full }: { url: string; full?: boolean }) {
  if (!url) return <div className="flex h-full w-full items-center justify-center bg-muted"><Newspaper className="h-10 w-10 text-muted-foreground" /></div>;
  return isVideo(url)
    ? <video src={url} controls={full} autoPlay={!full} muted={!full} loop={!full} playsInline className="h-full w-full object-cover bg-black" />
    : <img src={url} alt="" className="h-full w-full object-cover" />;
}

function Card({ n, big, onOpen }: { n: News; big?: boolean; onOpen: () => void }) {
  return (
    <motion.button initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onClick={onOpen}
      className={cn('group text-left overflow-hidden rounded-2xl border bg-card shadow-sm hover:shadow-lg transition-shadow', big && 'md:col-span-2 md:grid md:grid-cols-2')}>
      <div className="aspect-video overflow-hidden"><div className="h-full w-full transition-transform duration-500 group-hover:scale-105"><Media url={n.media} /></div></div>
      <div className="p-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          {n.pinned && <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-primary-foreground"><Pin className="h-3 w-3" />Pinned</span>}
          {n.category && <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{n.category}</span>}
          <span className="text-muted-foreground">{formatDate(n.publishedAt)}</span>
        </div>
        <h3 className={cn('font-bold leading-snug group-hover:text-primary', big ? 'text-2xl' : 'text-lg')}>{n.title}</h3>
        {n.summary && <p className="text-sm text-muted-foreground line-clamp-3">{n.summary}</p>}
      </div>
    </motion.button>
  );
}

export default function NewsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['news'], queryFn: () => getNews({}), staleTime: 60_000 });
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<News | null>(null);
  const items = (data?.news ?? []).filter((n) => `${n.title} ${n.summary} ${n.category}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container mx-auto max-w-6xl px-4 md:px-6 py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Latest</p><h1 className="text-4xl font-bold">News & Updates</h1></div>
        <div className="relative md:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search updates" className="pl-9" /></div>
      </div>
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
      ) : !items.length ? (
        <p className="py-20 text-center text-muted-foreground">No updates yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">{items.map((n, i) => <Card key={n.id} n={n} big={i === 0 && !q} onOpen={() => setOpen(n)} />)}</div>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          {open && <>
            {open.media && <div className="aspect-video"><Media url={open.media} full /></div>}
            <div className="p-6 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground">{[open.category, formatDate(open.publishedAt)].filter(Boolean).join(' · ')}</p>
              <DialogTitle className="text-2xl font-bold">{open.title}</DialogTitle>
              {open.summary && <p className="text-muted-foreground">{open.summary}</p>}
              {open.body && <MarkdownArticle content={open.body} />}
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

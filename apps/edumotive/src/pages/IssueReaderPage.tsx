import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookOpen, ChevronLeft, ChevronRight, Loader2, Maximize2, Minus, Plus, X } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { getIssue } from 'zitejs/api';
import { formatDate, useContent } from '../lib/content';
import { Button } from '@project/components/ui/button';
import { Progress } from '@project/components/ui/progress';
import { Skeleton } from '@project/components/ui/skeleton';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FlipBook = HTMLFlipBook as unknown as ComponentType<any>;

export default function IssueReaderPage() {
  const { id = '' } = useParams();
  const { data, error } = useQuery({ queryKey: ['issue', id], queryFn: () => getIssue({ id }) });
  const { data: content } = useContent();
  const [reading, setReading] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);
  useEffect(() => setReading(false), [id]);

  const list = content?.issues ?? [];
  const pos = list.findIndex((x) => x.id === id);
  const meta = list[pos];
  const older = pos >= 0 ? list[pos + 1] : undefined;
  const newer = pos > 0 ? list[pos - 1] : undefined;
  const stories = (content?.articles ?? []).filter((a) => a.issueId === id);

  if (error) return <div className="text-center py-24">Issue not available. <Link className="text-primary underline" to="/issues">Back</Link></div>;
  const open = () => { setReading(true); setTimeout(() => readerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80); };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl space-y-10">
      <Button asChild variant="ghost" size="sm"><Link to="/issues"><ArrowLeft className="h-4 w-4" />All issues</Link></Button>
      <div className="grid lg:grid-cols-[360px_1fr] gap-8 items-start">
        <aside className="glass p-6 space-y-5 lg:sticky lg:top-28">
          <button onClick={open} className="group block w-full overflow-hidden rounded-lg shadow-2xl">
            {meta?.coverImage ? <img src={meta.coverImage} alt={meta.title} className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <Skeleton className="w-full aspect-[3/4]" />}
          </button>
          <div className="flex items-center justify-between gap-3">
            <button onClick={open} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider hover:text-primary"><BookOpen className="h-4 w-4" />Read e-magazine</button>
            <Button asChild size="sm" className="rounded-md"><Link to="/subscribe">Subscribe</Link></Button>
          </div>
          <div className="flex items-center gap-5 border-t pt-4 text-sm">
            <span className="font-semibold">{formatDate(data?.issueDate || meta?.issueDate)}</span>
            <span className="font-bold uppercase tracking-wider text-primary">{stories.length} {stories.length === 1 ? 'story' : 'stories'}</span>
          </div>
          {data?.description && <p className="text-sm text-muted-foreground leading-relaxed">{data.description}</p>}
        </aside>

        <section className="space-y-2 min-w-0">
          <div className="flex flex-wrap items-end justify-between gap-3 pb-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">{data?.title ?? meta?.title}</p>
              <h1 className="text-4xl md:text-5xl font-black text-primary underline decoration-2 underline-offset-8">In this issue</h1>
            </div>
            <div className="flex gap-4 text-sm font-bold uppercase tracking-wider">
              {older ? <Link to={`/issues/${older.id}`} className="flex items-center gap-1.5 text-primary hover:opacity-80"><ArrowLeft className="h-4 w-4" />Previous issue</Link> : <span className="flex items-center gap-1.5 text-muted-foreground/50"><ArrowLeft className="h-4 w-4" />Previous issue</span>}
              {newer ? <Link to={`/issues/${newer.id}`} className="flex items-center gap-1.5 text-primary hover:opacity-80">Next issue<ArrowRight className="h-4 w-4" /></Link> : <span className="flex items-center gap-1.5 text-muted-foreground/50">Next issue<ArrowRight className="h-4 w-4" /></span>}
            </div>
          </div>
          {!content ? <Skeleton className="h-96" /> : stories.length === 0 ? (
            <div className="glass p-10 text-center space-y-3"><p className="text-muted-foreground">The stories list for this issue hasn't been added yet.</p><Button onClick={open}><BookOpen className="h-4 w-4" />Read the full magazine</Button></div>
          ) : (
            <ul className="divide-y">
              {stories.map((a) => (
                <li key={a.id}>
                  <Link to={`/articles/${a.id}`} className="group grid sm:grid-cols-[280px_1fr] gap-5 py-6">
                    <div className="overflow-hidden rounded-lg bg-muted aspect-[16/10]">{a.coverImage && <img src={a.coverImage} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />}</div>
                    <div className="space-y-2">
                      {a.section && <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{a.section}</p>}
                      <h2 className="text-2xl font-bold leading-snug group-hover:text-primary transition-colors">{a.title}</h2>
                      {a.excerpt && <p className="text-muted-foreground leading-relaxed line-clamp-3">{a.excerpt}</p>}
                      <p className="text-sm pt-1">{a.authorName}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <div ref={readerRef} className="scroll-mt-28">{reading && data?.pdfUrl && <Reader pdfUrl={data.pdfUrl} title={data.title} onClose={() => setReading(false)} />}</div>
    </div>
  );
}

function Reader({ pdfUrl, title, onClose }: { pdfUrl: string; title: string; onClose: () => void }) {
  const [pages, setPages] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [ratio, setRatio] = useState(1.414);
  const [zoom, setZoom] = useState(1);
  const [page, setPage] = useState(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const book = useRef<any>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const mobile = window.innerWidth < 768;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pdf = await pdfjs.getDocument(pdfUrl).promise;
      setTotal(pdf.numPages);
      const out: string[] = [];
      for (let n = 1; n <= pdf.numPages && !cancelled; n++) {
        const pg = await pdf.getPage(n);
        const vp = pg.getViewport({ scale: 1.6 });
        if (n === 1) setRatio(vp.height / vp.width);
        const canvas = document.createElement('canvas');
        canvas.width = vp.width; canvas.height = vp.height;
        await pg.render({ canvasContext: canvas.getContext('2d')!, viewport: vp }).promise;
        out.push(canvas.toDataURL('image/jpeg', 0.85));
        setPages([...out]);
      }
    })().catch(() => setTotal(-1));
    return () => { cancelled = true; };
  }, [pdfUrl]);

  const base = Math.min(400, (window.innerWidth - 64) / (mobile ? 1 : 2));
  const w = Math.round(base * zoom);
  const h = Math.round(w * ratio);
  const loading = !total || pages.length < total;

  return (
    <div className="glass p-4 md:p-6 space-y-4 no-select" onContextMenu={(e) => e.preventDefault()}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold mr-auto">{title}</h2>
        {!loading && <span className="text-xs text-muted-foreground">Page {page + 1} / {total}</span>}
        <div className="flex items-center rounded-full border bg-background/60">
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" disabled={zoom <= 0.6} onClick={() => setZoom(+(zoom - 0.15).toFixed(2))}><Minus className="h-3.5 w-3.5" /></Button>
          <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" disabled={zoom >= 1.6} onClick={() => setZoom(+(zoom + 0.15).toFixed(2))}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <Button size="icon" variant="ghost" title="Full screen" onClick={() => boxRef.current?.requestFullscreen?.()}><Maximize2 className="h-4 w-4" /></Button>
        <Button size="icon" variant="ghost" title="Close" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      {total === -1 ? <p className="text-center text-muted-foreground py-10">This issue couldn't be opened.</p> : loading ? (
        <div className="max-w-md mx-auto p-8 text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p>Preparing the flipbook… {pages.length}/{total || '?'}</p>
          <Progress value={total ? (pages.length / total) * 100 : 5} />
        </div>
      ) : (
        <div ref={boxRef} className="overflow-auto rounded-xl bg-muted/40 py-6 flex flex-col items-center gap-4" style={{ resize: 'vertical', minHeight: 300, height: Math.min(h + 120, window.innerHeight * 0.92) }}>
          <FlipBook key={`${w}x${h}`} ref={book} width={w} height={h} showCover usePortrait={mobile} mobileScrollSupport startPage={page} onFlip={(e: { data: number }) => setPage(e.data)} className="shadow-2xl mx-auto">
            {pages.map((src, i) => <div key={i} className="bg-white"><img src={src} alt={`Page ${i + 1}`} draggable={false} className="w-full h-full pointer-events-none" /></div>)}
          </FlipBook>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => book.current?.pageFlip().flipPrev()}><ChevronLeft className="h-4 w-4" />Previous</Button>
            <Button variant="outline" onClick={() => book.current?.pageFlip().flipNext()}>Next<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
      {!loading && <p className="text-[11px] text-center text-muted-foreground">Use + / − to resize the book, or drag the bottom edge of the reader.</p>}
    </div>
  );
}

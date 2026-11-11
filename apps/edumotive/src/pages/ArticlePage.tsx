import { getSession } from '../lib/auth';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Feather, Link2, Mail, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { getArticle } from 'zitejs/api';
import { Skeleton } from '@project/components/ui/skeleton';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { formatDate, useContent } from '../lib/content';
import AuthorBadges from '../components/AuthorBadges';
import MarkdownArticle from '../components/MarkdownArticle';
import TableOfContents from '../components/TableOfContents';

function ShareRail({ title }: { title: string }) {
  const url = encodeURIComponent(location.href);
  const t = encodeURIComponent(title);
  const items = [
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${url}`, cls: 'bg-[#3b5998]', txt: 'f' },
    { label: 'X', href: `https://twitter.com/intent/tweet?url=${url}&text=${t}`, cls: 'bg-foreground', txt: '𝕏' },
    { label: 'WhatsApp', href: `https://wa.me/?text=${t}%20${url}`, cls: 'bg-[#25d366]', txt: 'W' },
  ];
  return (
    <div className="flex lg:flex-col gap-2">
      {items.map((i) => <a key={i.label} href={i.href} target="_blank" rel="noreferrer" title={`Share on ${i.label}`} className={`${i.cls} h-9 w-9 rounded-full text-white text-sm font-bold flex items-center justify-center shadow-md transition-transform hover:scale-110`}>{i.txt}</a>)}
      <button title="Copy link" onClick={() => { navigator.clipboard.writeText(location.href); toast.success('Link copied'); }} className="h-9 w-9 rounded-full bg-muted-foreground text-background flex items-center justify-center shadow-md transition-transform hover:scale-110"><Link2 className="h-4 w-4" /></button>
      <button title="Print" onClick={() => window.print()} className="h-9 w-9 rounded-full bg-muted-foreground text-background flex items-center justify-center shadow-md transition-transform hover:scale-110"><Printer className="h-4 w-4" /></button>
    </div>
  );
}

function WriteCard({ email, author }: { email: string; author: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const subject = encodeURIComponent(`Letter to the editor — re: ${author}`);
  return (
    <div className="glass relative p-5 text-center space-y-3">
      <button onClick={() => setHidden(true)} className="absolute top-2 right-2 h-6 w-6 rounded-full bg-muted flex items-center justify-center" aria-label="Close"><X className="h-3 w-3" /></button>
      <div className="mx-auto h-11 w-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Feather className="h-5 w-5" /></div>
      <p className="font-display text-lg font-bold leading-snug">Write for EduMotive</p>
      <p className="text-xs text-muted-foreground leading-relaxed">Have a response to this piece, or a story of your own? Send a letter to the author or the editors.</p>
      <div className="space-y-2">
        {email && <Button asChild size="sm" className="w-full rounded-md"><a href={`mailto:${email}?subject=${subject}`}><Mail className="h-3.5 w-3.5" />Letter to the editors</a></Button>}
        <Button asChild size="sm" variant="outline" className="w-full rounded-md"><Link to="/write">Submit an article</Link></Button>
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const { id = '' } = useParams();
  const { data: content } = useContent();
  const { data, isLoading, error } = useQuery({ queryKey: ['article', id], queryFn: () => getArticle({ session: getSession(),  id }) });

  useEffect(() => {
    if (data) document.title = `${data.title} — Edumotive`;
    if (data && location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 300);
  }, [data]);

  if (isLoading) return <div className="container mx-auto px-4 py-10 max-w-5xl space-y-4"><Skeleton className="h-12 w-3/4" /><Skeleton className="h-80" /><Skeleton className="h-40" /></div>;
  if (error || !data) return <div className="text-center py-24 space-y-4"><p className="text-xl">This article isn't available.</p><Button asChild><Link to="/articles">Back to articles</Link></Button></div>;

  const author = content?.authors.find((x) => x.id === data.authorId);
  const mins = Math.max(1, Math.round(data.content.split(/\s+/).length / 200));
  const email = content?.settings.contactEmail ?? '';

  return (
    <div className="container mx-auto px-3 sm:px-4 py-6 md:py-10 max-w-7xl">
      <Button asChild variant="ghost" size="sm" className="mb-3"><Link to="/articles"><ArrowLeft className="h-4 w-4" />Articles</Link></Button>
      <div className="grid lg:grid-cols-[230px_minmax(0,760px)_230px] gap-8 justify-center items-start">
        <aside className="hidden lg:block sticky top-32 space-y-6">
          <TableOfContents content={data.content} />
          <ShareRail title={data.title} />
          <WriteCard email={email} author={data.authorName} />
        </aside>

        <article className="min-w-0 space-y-6">
          <header className="text-center space-y-4">
            {data.status !== 'Published' && <Badge variant="outline">{data.status} — only you can see this</Badge>}
            {data.section && <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">{data.section}</p>}
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">{data.title}</h1>
            {data.excerpt && <p className="text-lg text-muted-foreground font-serif italic">{data.excerpt}</p>}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-y py-3 text-sm text-muted-foreground">
              <Link to={author ? `/authors/${author.id}` : '#'} className="flex items-center gap-2 hover:text-foreground">
                <span className="h-7 w-7 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-bold">{author?.avatar ? <img src={author.avatar} alt="" className="h-full w-full object-cover" /> : data.authorName[0]}</span>
                By <strong className="text-foreground">{data.authorName}</strong>
              </Link>
              <span>•</span><span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{mins} min read</span>
              <span>•</span><span>{formatDate(data.publishedAt)}</span>
            </div>
          </header>
          {data.coverImage && <img src={data.coverImage} alt="" className="w-full aspect-[16/10] object-cover rounded-xl shadow-xl" />}
          <div className="lg:hidden space-y-4"><TableOfContents content={data.content} /><ShareRail title={data.title} /></div>
          <MarkdownArticle content={data.content} />
          <div className="lg:hidden"><WriteCard email={email} author={data.authorName} /></div>
        </article>

        <aside className="hidden lg:block sticky top-32">
          <Link to={author ? `/authors/${author.id}` : '#'} className="glass block p-5 text-center space-y-3 group">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Written by</p>
            <div className="mx-auto h-20 w-20 rounded-full p-[3px] bg-gradient-to-tr from-primary to-accent">
              <div className="h-full w-full rounded-full overflow-hidden bg-muted border-2 border-card flex items-center justify-center text-2xl font-bold">{author?.avatar ? <img src={author.avatar} alt="" className="h-full w-full object-cover" /> : data.authorName[0]}</div>
            </div>
            <div><p className="font-display text-lg font-bold group-hover:text-primary">{data.authorName}</p><p className="text-xs text-muted-foreground">{author?.designation || author?.institution || 'Contributor'}</p></div>
            {author && <div className="flex justify-center"><AuthorBadges badges={author.badges} /></div>}
            {author?.bio && <p className="text-xs text-muted-foreground leading-relaxed line-clamp-5">{author.bio}</p>}
          </Link>
        </aside>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArticleSummary, formatDate } from '../lib/content';
import { cn } from '@project/components/lib/utils';

export default function ArticleCard({ a, big }: { a: ArticleSummary; big?: boolean }) {
  return (
    <Link to={`/articles/${a.id}`} className={cn('glass group overflow-hidden flex flex-col transition-transform hover:-translate-y-1', big && 'md:col-span-2')}>
      <div className={cn('overflow-hidden bg-muted', big ? 'aspect-[16/9]' : 'aspect-[4/3]')}>
        {a.coverImage && <img src={a.coverImage} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
      </div>
      <div className="p-5 flex flex-col gap-2 flex-1">
        {a.section && <span className="text-[11px] font-bold uppercase tracking-widest text-primary">{a.section}</span>}
        <h3 className={cn('font-bold leading-snug', big ? 'text-2xl md:text-3xl' : 'text-xl')}>{a.title}</h3>
        {a.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{a.excerpt}</p>}
        <div className="mt-auto pt-2 text-xs text-muted-foreground">{a.authorName} · {formatDate(a.publishedAt)}</div>
      </div>
    </Link>
  );
}

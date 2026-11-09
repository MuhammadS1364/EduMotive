import { useEffect, useState } from 'react';
import { cn } from '@project/components/lib/utils';
import { extractHeadings } from '../lib/content';

export default function TableOfContents({ content, className }: { content: string; className?: string }) {
  const headings = extractHeadings(content);
  const [active, setActive] = useState('');

  useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter((e): e is HTMLElement => !!e);
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-140px 0px -65% 0px' },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!headings.length) return null;
  return (
    <nav className={cn('glass p-5', className)}>
      <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">Table of contents</p>
      <ol className="space-y-1 text-sm">
        {headings.map((h, i) => (
          <li key={i}>
            <a
              href={`#${h.id}`}
              onClick={(e) => { e.preventDefault(); document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' }); history.replaceState(null, '', `#${h.id}`); }}
              className={cn('block py-1 border-l-2 transition-colors', h.level === 3 ? 'pl-6' : 'pl-3',
                active === h.id ? 'border-primary text-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground')}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

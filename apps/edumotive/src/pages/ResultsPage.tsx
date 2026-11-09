import { useMemo, useState } from 'react';
import { Award, Medal, Search, Trophy } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { Skeleton } from '@project/components/ui/skeleton';
import { cn } from '@project/components/lib/utils';
import { useContent } from '../lib/content';

const ORDER = ['1st', '2nd', '3rd', 'A Grade', 'B Grade'];
const STYLE: Record<string, string> = {
  '1st': 'bg-yellow-400/90 text-yellow-950', '2nd': 'bg-slate-300 text-slate-900', '3rd': 'bg-amber-700 text-amber-50',
  'A Grade': 'bg-accent text-accent-foreground', 'B Grade': 'bg-muted text-foreground',
};

export default function ResultsPage() {
  const { data, isLoading } = useContent();
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const m = new Map<string, NonNullable<typeof data>['results']>();
    (data?.results ?? [])
      .filter((r) => !q || `${r.participant} ${r.programName} ${r.institution}`.toLowerCase().includes(q.toLowerCase()))
      .forEach((r) => m.set(r.programName, [...(m.get(r.programName) ?? []), r]));
    return [...m.entries()].map(([k, v]) => [k, v.sort((a, b) => ORDER.indexOf(a.position) - ORDER.indexOf(b.position))] as const);
  }, [data, q]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold">Program Results</h1>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, program or institution" className="pl-9 rounded-full bg-background/60" />
        </div>
      </div>
      {isLoading ? <Skeleton className="h-64" /> : groups.length === 0 ? <p className="text-center text-muted-foreground py-16">No results published yet.</p> : groups.map(([program, rows]) => (
        <section key={program} className="glass p-6 space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6 text-primary" />{program}</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {rows.filter((r) => ['1st', '2nd', '3rd'].includes(r.position)).map((r) => (
              <div key={r.id} className="rounded-xl border bg-background/60 p-4 text-center space-y-1">
                <span className={cn('inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold', STYLE[r.position])}><Medal className="h-3 w-3" />{r.position}</span>
                <p className="font-bold text-lg">{r.participant}</p>
                <p className="text-xs text-muted-foreground">{r.institution}</p>
              </div>
            ))}
          </div>
          {rows.some((r) => r.position.includes('Grade')) && (
            <div className="flex flex-wrap gap-2">
              {rows.filter((r) => r.position.includes('Grade')).map((r) => (
                <span key={r.id} className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm', STYLE[r.position])}>
                  <Award className="h-3.5 w-3.5" /><strong>{r.position[0]}</strong> {r.participant}{r.institution && <span className="opacity-70">· {r.institution}</span>}
                </span>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

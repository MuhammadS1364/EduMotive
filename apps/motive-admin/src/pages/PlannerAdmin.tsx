import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { useTable, fmtDate } from '../lib/admin';

const COLS = ['Idea', 'Writing', 'Review', 'Scheduled', 'Published'];

export default function PlannerAdmin() {
  const { rows, save, remove } = useTable('contentPlans');
  const [title, setTitle] = useState('');
  const add = () => { if (!title.trim()) return; save.mutate({ record: { title, status: 'Idea' } }, { onSuccess: () => { setTitle(''); toast.success('Added'); } }); };
  return (
    <div className="space-y-5">
      <h1 className="text-2xl md:text-3xl font-bold">Content planner</h1>
      <div className="flex gap-2 max-w-lg"><Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="New idea…" /><Button onClick={add}><Plus className="h-4 w-4" />Add</Button></div>
      <div className="flex gap-4 overflow-x-auto scrollbar-none snap-x pb-4">
        {COLS.map((c) => (
          <div key={c} className="glass p-3 w-72 shrink-0 snap-start space-y-3">
            <p className="font-bold text-sm uppercase tracking-wider">{c} <span className="text-muted-foreground">({rows.filter((r) => r.status === c).length})</span></p>
            {rows.filter((r) => r.status === c).map((r) => (
              <div key={r.id} className="rounded-lg border bg-card p-3 space-y-2">
                <p className="font-semibold text-sm">{r.title}</p>
                {r.dueDate && <p className="text-xs text-muted-foreground">Due {fmtDate(r.dueDate)}</p>}
                <div className="flex gap-2">
                  <select value={r.status} onChange={(e) => save.mutate({ id: r.id, record: { status: e.target.value } })} className="h-8 flex-1 rounded-md border bg-background px-2 text-xs">{COLS.map((x) => <option key={x}>{x}</option>)}</select>
                  <input type="date" value={(r.dueDate ?? '').slice(0, 10)} onChange={(e) => save.mutate({ id: r.id, record: { dueDate: e.target.value || null } })} className="h-8 rounded-md border bg-background px-1 text-xs w-[110px]" />
                  <Button size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => remove.mutate(r.id)}>✕</Button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

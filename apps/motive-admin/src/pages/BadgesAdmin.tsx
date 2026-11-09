import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import { cn } from '@project/components/lib/utils';
import CrudPage from '../components/CrudPage';
import { useTable, arr } from '../lib/admin';

function Assign() {
  const { rows: profiles, save } = useTable('profiles');
  const { rows: badges } = useTable('badges');
  if (!profiles.length) return <div className="glass p-10 text-center text-muted-foreground">No members have joined yet.</div>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Tap a badge to give it to or take it from a member. Automatic badges (first publication, 5 and 10 articles) are also added when you approve articles.</p>
      {profiles.map((p) => {
        const mine = arr(p.badges);
        return (
          <div key={p.id} className="glass p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 sm:w-64 shrink-0">
              <div className="h-10 w-10 rounded-full bg-muted overflow-hidden flex items-center justify-center font-bold">{p.avatar ? <img src={p.avatar} alt="" className="h-full w-full object-cover" /> : (p.name ?? '?')[0]}</div>
              <div className="min-w-0"><p className="font-semibold truncate">{p.name}</p><p className="text-xs text-muted-foreground">{p.role} · {p.institution}</p></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {badges.map((b) => {
                const on = mine.includes(b.id);
                return (
                  <button key={b.id} onClick={() => save.mutate({ id: p.id, record: { badges: on ? mine.filter((x) => x !== b.id) : [...mine, b.id] } }, { onSuccess: () => toast.success(on ? 'Badge removed' : 'Badge given') })}
                    className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', on ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50 opacity-70 hover:opacity-100')}>
                    <span className="inline-flex items-center gap-1">{b.icon ? <img src={b.icon} alt="" className="h-4 w-4 object-contain" /> : b.emoji} {b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BadgesAdmin() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl md:text-3xl font-bold">Author Badges</h1>
      <Tabs defaultValue="assign">
        <TabsList><TabsTrigger value="assign">Give badges</TabsTrigger><TabsTrigger value="manage">Manage badges</TabsTrigger></TabsList>
        <TabsContent value="assign" className="pt-4"><Assign /></TabsContent>
        <TabsContent value="manage" className="pt-4">
          <CrudPage table="badges" title="Badges" titleKey="name" imageKey="icon" subtitle={(r) => `${r.rule === 'Manual' || !r.rule ? 'Given by admin' : 'Auto: ' + r.rule}`} defaults={{ rule: 'Manual' }}
            fields={[{ key: 'name', label: 'Badge name', type: 'text', required: true }, { key: 'icon', label: 'Badge icon (PNG)', type: 'image' }, { key: 'rule', label: 'How it is earned', type: 'select', options: ['Manual', 'First Publication', '5 Publications', '10 Publications'] }, { key: 'description', label: 'Description', type: 'textarea' }]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

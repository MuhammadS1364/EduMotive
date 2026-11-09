import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { stories, StoriesOutputType } from 'zitejs/api';
import { Dialog, DialogContent, DialogTitle } from '@project/components/ui/dialog';
import NewPost from './NewPost';

type Group = StoriesOutputType['groups'][0];

function Ring({ g, label, onClick, add }: { g?: Group; label: string; onClick: () => void; add?: boolean }) {
  return (
    <button onClick={onClick} className="shrink-0 w-16 flex flex-col items-center gap-1">
      <span className={`relative h-16 w-16 rounded-full p-[2.5px] ${g ? 'bg-gradient-to-tr from-primary via-accent to-secondary' : 'bg-border'}`}>
        <span className="h-full w-full rounded-full overflow-hidden bg-muted border-2 border-card flex items-center justify-center font-bold">
          {g?.avatar ? <img src={g.avatar} alt="" className="h-full w-full object-cover" /> : (g?.authorName ?? '+')[0]}
        </span>
        {add && <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center"><Plus className="h-3 w-3" /></span>}
      </span>
      <span className="text-[11px] truncate w-full text-center">{label}</span>
    </button>
  );
}

export default function StoriesBar() {
  const { data, refetch } = useQuery({ queryKey: ['stories'], queryFn: () => stories({ action: 'list' }) });
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<Group | null>(null);
  const groups = data?.groups ?? [];
  const mine = groups.find((g) => g.mine);
  return (
    <div className="glass p-3">
      <div className="flex gap-3 overflow-x-auto scrollbar-none">
        <Ring g={mine} label="Your status" add onClick={() => (mine ? setView(mine) : setAdding(true))} />
        {groups.filter((g) => !g.mine).map((g) => <Ring key={g.authorId} g={g} label={g.authorName.split(' ')[0]} onClick={() => setView(g)} />)}
      </div>
      <NewPost mode="status" open={adding} onOpenChange={setAdding} onDone={refetch} />
      {view && <Viewer group={view} onClose={() => setView(null)} onAdd={() => { setView(null); setAdding(true); }} onChanged={refetch} />}
    </div>
  );
}

function Viewer({ group, onClose, onAdd, onChanged }: { group: Group; onClose: () => void; onAdd: () => void; onChanged: () => void }) {
  const [i, setI] = useState(0);
  const s = group.items[i];
  const next = () => (i < group.items.length - 1 ? setI(i + 1) : onClose());
  useEffect(() => { if (s?.mediaType === 'Image') { const t = setTimeout(next, 5000); return () => clearTimeout(t); } }, [i]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!s) return null;
  const del = async () => { try { await stories({ action: 'delete', storyId: s.id }); onChanged(); onClose(); } catch { toast.error('Could not delete'); } };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 max-w-sm overflow-hidden bg-black border-0 [&>button]:hidden">
        <DialogTitle className="sr-only">{group.authorName}'s status</DialogTitle>
        <div className="relative aspect-[9/16] bg-black">
          <div className="absolute top-2 inset-x-2 z-10 flex gap-1">{group.items.map((_, k) => <span key={k} className={`h-0.5 flex-1 rounded ${k <= i ? 'bg-white' : 'bg-white/35'}`} />)}</div>
          <div className="absolute top-5 inset-x-3 z-10 flex items-center gap-2 text-white">
            <span className="text-sm font-semibold">{group.authorName}</span>
            <span className="text-xs opacity-70">{s.created && formatDistanceToNow(new Date(s.created))}</span>
            <span className="ml-auto flex gap-1">
              {group.mine && <><button onClick={onAdd} className="p-1"><Plus className="h-5 w-5" /></button><button onClick={del} className="p-1"><Trash2 className="h-5 w-5" /></button></>}
              <button onClick={onClose} className="p-1"><X className="h-5 w-5" /></button>
            </span>
          </div>
          {s.mediaType === 'Video' ? <video key={s.id} src={s.media} autoPlay playsInline onEnded={next} className="h-full w-full object-contain" /> : <img src={s.media} alt="" className="h-full w-full object-contain" />}
          <button aria-label="Previous" className="absolute left-0 top-16 bottom-16 w-1/3" onClick={() => setI(Math.max(0, i - 1))} />
          <button aria-label="Next" className="absolute right-0 top-16 bottom-16 w-1/3" onClick={next} />
          {s.caption && <p className="absolute bottom-4 inset-x-4 text-center text-white text-sm bg-black/40 backdrop-blur rounded-xl px-3 py-2">{s.caption}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

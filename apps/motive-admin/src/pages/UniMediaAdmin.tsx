import { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@project/components/ui/alert-dialog';
import { useTable, Rec, arr, fmtDate } from '../lib/admin';

export default function UniMediaAdmin() {
  const { rows, save, remove } = useTable('posts');
  const [del, setDel] = useState<Rec | null>(null);
  const list = [...rows].sort((a, b) => String(b.created ?? '').localeCompare(String(a.created ?? '')));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl md:text-3xl font-bold">UniMedia posts</h1>
      {!list.length ? <div className="glass p-10 text-center text-muted-foreground">No posts yet.</div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((p) => (
            <div key={p.id} className={`glass overflow-hidden ${p.hidden ? 'opacity-60' : ''}`}>
              <div className="aspect-square bg-muted">{p.image && <img src={p.image} alt="" className="h-full w-full object-cover" />}</div>
              <div className="p-3 space-y-1">
                <div className="flex items-center gap-2"><p className="font-semibold text-sm truncate">{p.authorName}</p>{p.hidden && <Badge variant="secondary">Hidden</Badge>}</div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.caption}</p>
                <p className="text-[11px] text-muted-foreground">♥ {arr(p.likedBy).length} · {fmtDate(p.created)}</p>
                <div className="flex gap-1 pt-1">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => save.mutate({ id: p.id, record: { hidden: !p.hidden } })}>{p.hidden ? <><Eye className="h-4 w-4" />Show</> : <><EyeOff className="h-4 w-4" />Hide</>}</Button>
                  <Button size="icon" variant="ghost" onClick={() => setDel(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this post?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (del) remove.mutate(del.id); setDel(null); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

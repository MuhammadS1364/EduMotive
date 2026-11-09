import { useState } from 'react';
import { Check, Pencil, Plus, Star, Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Badge } from '@project/components/ui/badge';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@project/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from '@project/components/ui/alert-dialog';
import { cn } from '@project/components/lib/utils';
import { useTable, Rec, fmtDate } from '../lib/admin';
import ArticleEditor from '../components/ArticleEditor';
import ImageUpload from '../components/ImageUpload';

const TABS = ['Pending', 'Published', 'Rejected', 'Draft', 'All'];

export default function ArticlesAdmin() {
  const { rows, isLoading, save, remove } = useTable('articles');
  const sections = useTable('sections').rows;
  const authors = useTable('profiles').rows.filter((p) => p.role === 'Author').sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
  const issues = useTable('issues').rows.slice().sort((a, b) => String(b.issueDate ?? '').localeCompare(String(a.issueDate ?? '')));
  const first = (v: unknown) => [v].flat().filter(Boolean)[0] as string | undefined;
  const [tab, setTab] = useState('Pending');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<Rec | null>(null);
  const [del, setDel] = useState<Rec | null>(null);
  const list = rows.filter((r) => (tab === 'All' || r.status === tab) && (!q || `${r.title} ${r.authorName}`.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => String(b.created ?? '').localeCompare(String(a.created ?? '')));

  const setStatus = (r: Rec, status: string) => save.mutate({ id: r.id, record: { status, ...(status === 'Published' && !r.publishedAt ? { publishedAt: new Date().toISOString() } : {}) } }, { onSuccess: () => toast.success(`Marked ${status}`) });

  const submit = async () => {
    if (!edit?.title || !edit.content) { toast.error('Title and content are required'); return; }
    const { id, title, excerpt, content, coverImage, section, status, featured } = edit;
    const ap = first(edit.authorProfile); const iss = first(edit.issue);
    const authorName = ap ? authors.find((x) => x.id === ap)?.name : edit.authorName;
    await save.mutateAsync({ id: id || undefined, record: { title, excerpt, content, coverImage, section, authorProfile: ap ? [ap] : null, issue: iss ? [iss] : null, authorName: authorName || 'Edumotive Desk', status: status || 'Published', featured: !!featured, ...((status || 'Published') === 'Published' && !edit.publishedAt ? { publishedAt: new Date().toISOString() } : {}) } });
    toast.success('Saved'); setEdit(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <h1 className="text-2xl md:text-3xl font-bold mr-auto">Articles</h1>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="w-44 md:w-56" />
        <Button onClick={() => setEdit({ id: '', status: 'Published', content: '' })}><Plus className="h-4 w-4" />New</Button>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={cn('shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold border', tab === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-background/50')}>{t} {t !== 'All' && `(${rows.filter((r) => r.status === t).length})`}</button>)}
      </div>
      {isLoading ? <Skeleton className="h-64" /> : list.length === 0 ? <div className="glass p-10 text-center text-muted-foreground">No {tab.toLowerCase()} articles.</div> : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="glass p-4 flex flex-col sm:flex-row gap-4">
              <div className="h-20 w-full sm:w-28 rounded-lg bg-muted overflow-hidden shrink-0">{r.coverImage && <img src={r.coverImage} alt="" className="h-full w-full object-cover" />}</div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap"><p className="font-bold">{r.title}</p><Badge variant="secondary">{r.status}</Badge>{r.section && <Badge variant="outline">{r.section}</Badge>}{r.featured && <Star className="h-4 w-4 fill-primary text-primary" />}</div>
                <p className="text-xs text-muted-foreground">By {r.authorName} · {fmtDate(r.created)}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{r.excerpt}</p>
              </div>
              <div className="flex sm:flex-col gap-1 flex-wrap">
                {r.status !== 'Published' && <Button size="sm" onClick={() => setStatus(r, 'Published')}><Check className="h-4 w-4" />Approve</Button>}
                {r.status === 'Pending' && <Button size="sm" variant="outline" onClick={() => setStatus(r, 'Rejected')}><X className="h-4 w-4" />Reject</Button>}
                <Button size="sm" variant="ghost" onClick={() => save.mutate({ id: r.id, record: { featured: !r.featured } })}><Star className="h-4 w-4" />{r.featured ? 'Unfeature' : 'Feature'}</Button>
                <Button size="sm" variant="ghost" onClick={() => setEdit({ ...r })}><Pencil className="h-4 w-4" />Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => setDel(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? 'Edit article' : 'New article'}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2"><Label>Title *</Label><Input value={edit.title ?? ''} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Author</Label>
                  <select value={first(edit.authorProfile) ?? ''} onChange={(e) => setEdit({ ...edit, authorProfile: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="">{edit.authorName && !first(edit.authorProfile) ? `${edit.authorName} (unlinked)` : 'Edumotive Desk'}</option>
                    {authors.map((a) => <option key={a.id} value={a.id}>{a.name}{a.designation ? ` — ${a.designation}` : ''}</option>)}
                  </select>
                  <p className="text-[11px] text-muted-foreground">Add new authors in the Authors section.</p></div>
                <div className="space-y-1.5"><Label>Magazine issue</Label>
                  <select value={first(edit.issue) ?? ''} onChange={(e) => setEdit({ ...edit, issue: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Not in an issue</option>{issues.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}</select></div>
                <div className="space-y-1.5"><Label>Section</Label>
                  <select value={edit.section ?? ''} onChange={(e) => setEdit({ ...edit, section: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">None</option>{sections.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
                <div className="space-y-1.5"><Label>Status</Label>
                  <select value={edit.status ?? ''} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm">{TABS.slice(0, 4).map((t) => <option key={t}>{t}</option>)}</select></div>
                <div className="space-y-1.5"><Label>Cover image</Label><ImageUpload value={edit.coverImage ?? ''} onChange={(v) => setEdit({ ...edit, coverImage: v })} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>Excerpt</Label><Textarea rows={2} value={edit.excerpt ?? ''} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} /></div>
              </div>
              <div className="space-y-1.5"><Label>Content *</Label><ArticleEditor value={edit.content ?? ''} onChange={(v) => setEdit({ ...edit, content: v })} /></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button disabled={save.isPending} onClick={submit}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete “{del?.title}”?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (del) remove.mutate(del.id); setDel(null); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

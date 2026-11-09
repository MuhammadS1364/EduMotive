import { useState } from 'react';
import { Pencil, Plus, Search, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { Switch } from '@project/components/ui/switch';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@project/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@project/components/ui/alert-dialog';
import { useTable, Rec, TableName } from '../lib/admin';
import ImageUpload from './ImageUpload';

export type Field = {
  key: string; label: string;
  type: 'text' | 'textarea' | 'number' | 'image' | 'file' | 'checkbox' | 'select' | 'date' | 'url' | 'email';
  options?: string[]; required?: boolean; full?: boolean;
};

export default function CrudPage({ table, title, fields, titleKey, subtitle, imageKey, visibleKey, sort, defaults, filter }: {
  table: TableName; title: string; fields: Field[]; titleKey: string; subtitle?: (r: Rec) => string;
  imageKey?: string; visibleKey?: string; sort?: (a: Rec, b: Rec) => number; defaults?: Record<string, unknown>; filter?: (r: Rec) => boolean;
}) {
  const { rows, isLoading, save, remove } = useTable(table);
  const [edit, setEdit] = useState<Rec | null>(null);
  const [del, setDel] = useState<Rec | null>(null);
  const [q, setQ] = useState('');
  const list = rows.filter((r) => (!filter || filter(r)) && (!q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase()))).sort(sort ?? (() => 0));

  const submit = async () => {
    if (!edit) return;
    const missing = fields.find((f) => f.required && !edit[f.key] && edit[f.key] !== 0);
    if (missing) { toast.error(`${missing.label} is required`); return; }
    const record: Record<string, unknown> = {};
    Object.entries(defaults ?? {}).forEach(([k, v]) => { if (!edit.id) record[k] = v; });
    fields.forEach((f) => { record[f.key] = f.type === 'number' ? (edit[f.key] === '' || edit[f.key] == null ? null : Number(edit[f.key])) : f.type === 'checkbox' ? !!edit[f.key] : (edit[f.key] || null); });
    await save.mutateAsync({ id: edit.id || undefined, record });
    toast.success('Saved'); setEdit(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold mr-auto">{title}</h1>
        <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-8 w-44 md:w-56" /></div>
        <Button onClick={() => setEdit({ id: '', ...(defaults ?? {}) } as Rec)}><Plus className="h-4 w-4" />Add</Button>
      </div>
      {isLoading ? <Skeleton className="h-64" /> : list.length === 0 ? <div className="glass p-10 text-center text-muted-foreground">Nothing here yet. Click Add to create one.</div> : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((r) => (
            <div key={r.id} className="glass p-4 flex gap-3 items-start">
              {imageKey && <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">{r[imageKey] && <img src={r[imageKey]} alt="" className="h-full w-full object-cover" />}</div>}
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{r[titleKey] || 'Untitled'}</p>
                {subtitle && <p className="text-xs text-muted-foreground line-clamp-2">{subtitle(r)}</p>}
              </div>
              <div className="flex flex-col gap-1">
                {visibleKey && (
                  <Button size="icon" variant="ghost" title={r[visibleKey] ? 'Visible on website' : 'Hidden'} onClick={() => save.mutate({ id: r.id, record: { [visibleKey]: !r[visibleKey] } })}>
                    {r[visibleKey] ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => setEdit({ ...r })}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setDel(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? 'Edit' : 'Add'} {title.replace(/s$/, '').toLowerCase()}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key} className={`space-y-1.5 ${f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                  <Label>{f.label}{f.required && ' *'}</Label>
                  <FieldInput f={f} value={edit[f.key]} onChange={(v) => setEdit({ ...edit, [f.key]: v })} />
                </div>
              ))}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button disabled={save.isPending} onClick={submit}>{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!del} onOpenChange={(o) => !o && setDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete “{del?.[titleKey]}”?</AlertDialogTitle><AlertDialogDescription>This can't be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (del) remove.mutate(del.id); setDel(null); }}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FieldInput({ f, value, onChange }: { f: Field; value: any; onChange: (v: any) => void }) {
  switch (f.type) {
    case 'textarea': return <Textarea rows={4} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
    case 'checkbox': return <div className="pt-1"><Switch checked={!!value} onCheckedChange={onChange} /></div>;
    case 'image': return <ImageUpload value={value ?? ''} onChange={onChange} />;
    case 'file': return <ImageUpload value={value ?? ''} onChange={onChange} accept="application/pdf" label="Upload PDF" />;
    case 'select': return (
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
        <option value="">Select…</option>{f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    case 'date': return <Input type="date" value={(value ?? '').slice(0, 10)} onChange={(e) => onChange(e.target.value)} />;
    default: return <Input type={f.type === 'number' ? 'number' : f.type === 'email' ? 'email' : 'text'} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
}

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Label } from '@project/components/ui/label';
import { useSettings } from '../lib/admin';
import { Field, FieldInput } from './CrudPage';

export default function SettingsForm({ title, fields }: { title: string; fields: Field[] }) {
  const { settings, isLoading, save } = useSettings();
  const [v, setV] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!isLoading) setV(settings); }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const submit = async () => {
    setBusy(true);
    try {
      const out: Record<string, string> = {};
      fields.forEach((f) => { out[f.key] = f.type === 'checkbox' ? String(v[f.key] !== 'false') : (v[f.key] ?? ''); });
      await save(out); toast.success('Saved');
    } catch { toast.error('Save failed'); } finally { setBusy(false); }
  };

  return (
    <div className="glass p-5 space-y-4">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className={`space-y-1.5 ${f.type === 'textarea' || f.full ? 'sm:col-span-2' : ''}`}>
            <Label>{f.label}</Label>
            {f.type === 'checkbox'
              ? <FieldInput f={f} value={v[f.key] !== 'false'} onChange={(b: boolean) => setV({ ...v, [f.key]: String(b) })} />
              : <FieldInput f={f} value={v[f.key] ?? ''} onChange={(x: string) => setV({ ...v, [f.key]: x })} />}
          </div>
        ))}
      </div>
      <Button disabled={busy || isLoading} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
    </div>
  );
}

import { useState } from 'react';
import { z } from 'zod';
import { Check, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth, loginWithRedirect, getSession } from '../lib/auth';
import { createSubscription, getMyProfile } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import { cn } from '@project/components/lib/utils';
import { useContent } from '../lib/content';
import ImageUpload from '../components/ImageUpload';

const schema = z.object({
  name: z.string().min(1, 'Name is required'), email: z.string().email('Valid email required'), phone: z.string().min(6, 'Valid phone required'),
  address: z.string().min(5, 'Full postal address required'), transactionId: z.string().min(3, 'Enter the transaction / UTR ID'),
  paymentScreenshot: z.string().url('Upload the payment screenshot'),
});

export default function SubscribePage() {
  const { data } = useContent();
  const [planId, setPlanId] = useState('');
  const plans = data?.plans ?? [];
  const plan = plans.find((p) => p.id === planId) ?? plans[0];
  const { user } = useAuth();
  const me = useQuery({ queryKey: ['me'], queryFn: () => getMyProfile({ session: getSession() }), enabled: !!user });
  const [f, setF] = useState({ name: '', email: '', phone: '', address: '', transactionId: '', paymentScreenshot: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });

  const submit = async () => {
    const r = schema.safeParse(f);
    if (!r.success) { setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message]))); return; }
    setErrors({}); setBusy(true);
    try { if (!plan) { toast.error('Choose a plan'); setBusy(false); return; }
      await createSubscription({ session: getSession(),  ...r.data, planId: plan.id }); setDone(true); } catch { toast.error('Could not submit. Please try again.'); } finally { setBusy(false); }
  };

  if (done) return (
    <div className="container mx-auto px-4 py-20 max-w-lg"><div className="glass p-10 text-center space-y-3">
      <CheckCircle2 className="h-14 w-14 text-primary mx-auto" /><h1 className="text-3xl font-bold">Thank you!</h1>
      <p className="text-muted-foreground">We've received your order. Track payment verification and India Post delivery from your desk.</p><Button asChild className="rounded-full"><Link to="/account">Track my order</Link></Button>
    </div></div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl space-y-10">
      <div className="text-center space-y-2"><h1 className="text-4xl md:text-5xl font-extrabold">Subscribe to the print edition</h1><p className="text-muted-foreground">Choose a plan, pay via the QR code, and send us the proof.</p></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.length === 0 && <p className="text-center text-muted-foreground md:col-span-2">Subscription plans will be announced soon.</p>}
        {plans.map((p) => (
          <button key={p.id} onClick={() => setPlanId(p.id)} className={cn('glass p-8 text-left space-y-4 transition-all', plan?.id === p.id && 'ring-2 ring-primary scale-[1.02]')}>
            <div className="flex items-baseline justify-between gap-3"><span><span className="text-lg font-bold block">{p.name}</span><span className="text-xs text-muted-foreground">{p.duration}</span></span><span className="text-4xl font-extrabold font-serif">₹{p.price}</span></div>
            <ul className="space-y-2 text-sm">{p.features.map((x) => <li key={x} className="flex gap-2"><Check className="h-4 w-4 text-primary" />{x}</li>)}</ul>
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        <div className="glass p-6 text-center space-y-3 h-fit">
          <p className="font-bold">Scan & pay ₹{plan?.price ?? 0}</p>
          {data?.settings.paymentQr ? <img src={data.settings.paymentQr} alt="Payment QR" className="w-full rounded-lg bg-card p-2" /> : <p className="text-sm text-muted-foreground py-10">QR code coming soon.</p>}
          {data?.settings.upiId && <p className="text-sm">UPI: <strong>{data.settings.upiId}</strong></p>}
        </div>
        {!user ? (
          <div className="glass p-8 text-center space-y-3 h-fit"><p className="text-lg font-bold">Sign in to order</p><p className="text-muted-foreground text-sm">Create your profile first so you can track your magazine delivery here.</p><Button className="rounded-full" onClick={() => loginWithRedirect()}>Sign in / Join</Button></div>
        ) : me.data && !me.data.profile ? (
          <div className="glass p-8 text-center space-y-3 h-fit"><p className="text-lg font-bold">Complete your profile first</p><Button asChild className="rounded-full"><Link to="/account">Create profile</Link></Button></div>
        ) : (
        <div className="glass p-6 grid sm:grid-cols-2 gap-4">
          <Field label="Full name" error={errors.name}><Input value={f.name} onChange={(e) => set('name')(e.target.value)} /></Field>
          <Field label="Email" error={errors.email}><Input type="email" value={f.email} onChange={(e) => set('email')(e.target.value)} /></Field>
          <Field label="Phone" error={errors.phone}><Input value={f.phone} onChange={(e) => set('phone')(e.target.value)} /></Field>
          <Field label="Transaction / UTR ID" error={errors.transactionId}><Input value={f.transactionId} onChange={(e) => set('transactionId')(e.target.value)} /></Field>
          <div className="sm:col-span-2"><Field label="Postal address" error={errors.address}><Textarea value={f.address} onChange={(e) => set('address')(e.target.value)} /></Field></div>
          <div className="sm:col-span-2"><Field label="Payment screenshot" error={errors.paymentScreenshot}><ImageUpload value={f.paymentScreenshot} onChange={set('paymentScreenshot')} label="Upload screenshot" /></Field></div>
          <Button className="sm:col-span-2 rounded-full" size="lg" disabled={busy} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Place order</Button>
        </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>;
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, User as UserIcon, KeyRound, ArrowLeft } from 'lucide-react';
import { account } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { useAuth } from '../lib/auth';

type Step = 'signin' | 'signup' | 'verify' | 'forgot' | 'reset';
type GoogleId = { accounts: { id: { initialize: (o: object) => void; renderButton: (el: HTMLElement, o: object) => void } } };

const errMsg = (e: unknown) => (e as { userFacingMessage?: string })?.userFacingMessage || (e instanceof Error ? e.message : 'Something went wrong. Please try again.');
const next = () => { const n = new URLSearchParams(window.location.search).get('next'); return n && n.startsWith('/') && !n.startsWith('//') ? n : '/'; };

function Field({ id, label, icon: Icon, ...p }: { id: string; label: string; icon: typeof Mail } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id={id} className="pl-9 h-11" required {...p} /></div>
    </div>
  );
}

function GoogleButton({ onDone, onError }: { onDone: (credential: string) => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [clientId, setClientId] = useState('');
  useEffect(() => { account({ action: 'config' }).then((r) => setClientId(r.googleClientId ?? '')).catch(() => {}); }, []);
  useEffect(() => {
    if (!clientId || !ref.current) return;
    const draw = () => {
      const g = (window as unknown as { google?: GoogleId }).google;
      if (!g || !ref.current) return;
      g.accounts.id.initialize({ client_id: clientId, callback: (r: { credential?: string }) => (r.credential ? onDone(r.credential) : onError('Google sign-in was cancelled.')) });
      g.accounts.id.renderButton(ref.current, { theme: 'outline', size: 'large', width: ref.current.offsetWidth || 320, text: 'continue_with', shape: 'pill' });
    };
    if ((window as unknown as { google?: GoogleId }).google) { draw(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = draw;
    document.head.appendChild(s);
  }, [clientId, onDone, onError]);
  if (!clientId) return null;
  return (<>
    <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
    <div ref={ref} className="flex justify-center min-h-[44px]" />
  </>);
}

export default function LoginPage() {
  const { setSession, user } = useAuth();
  const [step, setStep] = useState<Step>('signin');
  const [f, setF] = useState({ name: '', email: '', password: '', code: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  useEffect(() => { if (user) window.location.replace(next()); }, [user]);

  const run = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); setInfo(''); try { await fn(); } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); } };
  const finish = (r: { token?: string; user?: unknown; needsCode?: boolean }) => {
    if (r.needsCode) { setStep('verify'); setInfo(`We sent a 6-digit code to ${f.email}.`); return; }
    if (r.token && r.user) { setSession(r.token, r.user as never); window.location.replace(next()); }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      if (step === 'signin') finish(await account({ action: 'login', email: f.email, password: f.password }));
      if (step === 'signup') finish(await account({ action: 'signup', email: f.email, password: f.password, name: f.name }));
      if (step === 'verify') finish(await account({ action: 'verify', email: f.email, code: f.code }));
      if (step === 'forgot') { await account({ action: 'forgot', email: f.email }); setStep('reset'); setInfo(`If an account exists for ${f.email}, we've emailed a 6-digit code.`); }
      if (step === 'reset') finish(await account({ action: 'reset', email: f.email, code: f.code, password: f.password }));
    });
  };
  const google = (credential: string) => run(async () => finish(await account({ action: 'google', credential })));

  const titles: Record<Step, [string, string]> = {
    signin: ['Welcome back', 'Sign in to your account'], signup: ['Create your account', 'Join with your email'],
    verify: ['Check your email', 'Enter the code we sent you'], forgot: ['Forgot password?', "We'll email you a reset code"], reset: ['Set a new password', 'Enter the code and your new password'],
  };
  const btn: Record<Step, string> = { signin: 'Sign in', signup: 'Create account', verify: 'Verify', forgot: 'Send code', reset: 'Save new password' };
  const go = (s: Step) => { setStep(s); setErr(''); setInfo(''); setF((x) => ({ ...x, code: '', password: '' })); };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-3xl border bg-card p-8 shadow-xl">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5">
            {step !== 'signin' && step !== 'signup' && <button onClick={() => go('signin')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back to sign in</button>}
            <div><h1 className="text-2xl font-bold">{titles[step][0]}</h1><p className="text-sm text-muted-foreground">{titles[step][1]}</p></div>
            <form onSubmit={submit} className="space-y-4">
              {step === 'signup' && <Field id="name" label="Full name" icon={UserIcon} value={f.name} onChange={set('name')} autoComplete="name" />}
              {step !== 'verify' && step !== 'reset' && <Field id="email" label="Email" icon={Mail} type="email" value={f.email} onChange={set('email')} autoComplete="email" />}
              {(step === 'verify' || step === 'reset') && <Field id="code" label="6-digit code" icon={KeyRound} inputMode="numeric" maxLength={6} pattern="\d{6}" value={f.code} onChange={set('code')} autoComplete="one-time-code" />}
              {(step === 'signin' || step === 'signup' || step === 'reset') && <Field id="password" label={step === 'reset' ? 'New password' : 'Password'} icon={Lock} type="password" minLength={step === 'signin' ? 1 : 8} value={f.password} onChange={set('password')} autoComplete={step === 'signin' ? 'current-password' : 'new-password'} />}
              {step === 'signin' && <button type="button" onClick={() => go('forgot')} className="text-sm text-primary hover:underline">Forgot password?</button>}
              {info && <p className="rounded-lg bg-muted p-3 text-sm">{info}</p>}
              {err && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{err}</p>}
              <Button type="submit" className="w-full h-11 rounded-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{btn[step]}</Button>
            </form>
            {(step === 'signin' || step === 'signup') && <GoogleButton onDone={google} onError={setErr} />}
            {step === 'signin' && <p className="text-center text-sm text-muted-foreground">New here? <button onClick={() => go('signup')} className="font-semibold text-primary hover:underline">Create an account</button></p>}
            {step === 'signup' && <p className="text-center text-sm text-muted-foreground">Already have an account? <button onClick={() => go('signin')} className="font-semibold text-primary hover:underline">Sign in</button></p>}
            {step === 'verify' && <p className="text-center text-sm text-muted-foreground">Didn't get it? Check spam, or <button onClick={() => go('signin')} className="font-semibold text-primary hover:underline">sign in again</button> to resend.</p>}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

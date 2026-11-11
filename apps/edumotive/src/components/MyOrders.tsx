import { getSession } from '../lib/auth';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, Copy, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getMySubscriptions } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { cn } from '@project/components/lib/utils';
import { formatDate } from '../lib/content';
import TrackFrame from './TrackFrame';

const STEPS = ['Awaiting Payment Check', 'Preparing', 'Dispatched', 'In Transit', 'Delivered'];

export default function MyOrders() {
  const [open, setOpen] = useState<string | null>(null);
  const { data } = useQuery({ queryKey: ['myOrders'], queryFn: () => getMySubscriptions({ session: getSession() }) });
  return (
    <div className="glass p-6 md:p-8 space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">My subscriptions</h2><Button asChild size="sm" variant="outline"><Link to="/subscribe">Order</Link></Button></div>
      {!data?.orders.length ? <p className="text-muted-foreground">No orders yet.</p> : data.orders.map((o) => {
        const step = o.status === 'Rejected' ? -1 : STEPS.indexOf(o.deliveryStatus);
        return (
          <div key={o.id} className="rounded-xl border bg-card/60 p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-2"><Package className="h-5 w-5 text-primary" /><p className="font-bold">{o.planName} · ₹{o.amount}</p><Badge variant={o.status === 'Rejected' ? 'destructive' : 'secondary'}>{o.status === 'Pending' ? 'Payment being verified' : o.status}</Badge><span className="text-xs text-muted-foreground ml-auto">{formatDate(o.created)}</span></div>
            {step >= 0 && (
              <div className="flex items-start">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex-1 flex flex-col items-center text-center relative">
                    {i > 0 && <div className={cn('absolute top-3 right-1/2 w-full h-0.5', i <= step ? 'bg-primary' : 'bg-border')} />}
                    <div className={cn('relative z-10 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2', i <= step ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border')}>{i <= step ? <Check className="h-3 w-3" /> : i + 1}</div>
                    <p className="text-[10px] sm:text-xs mt-1 leading-tight px-0.5">{s.replace('Awaiting Payment Check', 'Payment check')}</p>
                  </div>
                ))}
              </div>
            )}
            {o.trackingNumber ? (
              <div className="space-y-3 rounded-lg bg-muted/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">Speed Post tracking no: <strong className="font-mono">{o.trackingNumber}</strong></span>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(o.trackingNumber); toast.success('Copied'); }}><Copy className="h-3.5 w-3.5" />Copy</Button>
                  <Button size="sm" className="ml-auto" variant={open === o.id ? 'outline' : 'default'} onClick={() => { if (open !== o.id) navigator.clipboard.writeText(o.trackingNumber).catch(() => {}); setOpen(open === o.id ? null : o.id); }}>{open === o.id ? 'Hide tracker' : 'Track parcel'}</Button>
                </div>
                {open === o.id && <TrackFrame trackingNumber={o.trackingNumber} />}
              </div>
            ) : step >= 0 && <p className="text-xs text-muted-foreground">Your tracking number will appear here once the magazine is posted.</p>}
          </div>
        );
      })}
    </div>
  );
}

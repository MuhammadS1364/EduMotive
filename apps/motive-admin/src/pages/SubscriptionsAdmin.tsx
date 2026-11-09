import { Check, X, ExternalLink } from 'lucide-react';
import { Input } from '@project/components/ui/input';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Badge } from '@project/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import CrudPage from '../components/CrudPage';
import SettingsForm from '../components/SettingsForm';
import { useTable, fmtDate } from '../lib/admin';

function Requests() {
  const { rows, save } = useTable('subscriptions');
  const list = [...rows].sort((a, b) => String(b.created ?? '').localeCompare(String(a.created ?? '')));
  if (!list.length) return <div className="glass p-10 text-center text-muted-foreground">No subscription requests yet.</div>;
  return (
    <div className="space-y-3">
      {list.map((r) => (
        <div key={r.id} className="glass p-4 flex flex-col md:flex-row gap-4">
          {r.paymentScreenshot && <a href={r.paymentScreenshot} target="_blank" rel="noreferrer" className="h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0"><img src={r.paymentScreenshot} alt="Payment" className="h-full w-full object-cover" /></a>}
          <div className="flex-1 text-sm space-y-1">
            <div className="flex gap-2 items-center flex-wrap"><p className="font-bold text-base">{r.name}</p><Badge variant={r.status === 'Confirmed' ? 'default' : 'secondary'}>{r.status}</Badge><Badge variant="outline">{r.planName || r.plan} · ₹{r.amount}</Badge></div>
            <p className="text-muted-foreground">{r.email} · {r.phone}</p>
            <p className="text-muted-foreground">{r.address}</p>
            <p>Txn ID: <span className="font-mono">{r.transactionId}</span> · {fmtDate(r.created)}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <select value={r.deliveryStatus ?? ''} onChange={(e) => save.mutate({ id: r.id, record: { deliveryStatus: e.target.value } }, { onSuccess: () => toast.success('Delivery updated') })} className="h-9 rounded-md border bg-background px-2 text-sm">
                <option value="">Delivery status…</option>{['Awaiting Payment Check', 'Preparing', 'Dispatched', 'In Transit', 'Delivered'].map((s) => <option key={s}>{s}</option>)}
              </select>
              <Input defaultValue={r.trackingNumber ?? ''} placeholder="India Post tracking no." className="w-56 h-9"
                onBlur={(e) => { if (e.target.value !== (r.trackingNumber ?? '')) save.mutate({ id: r.id, record: { trackingNumber: e.target.value, ...(e.target.value && (!r.deliveryStatus || r.deliveryStatus === 'Preparing' || r.deliveryStatus === 'Awaiting Payment Check') ? { deliveryStatus: 'Dispatched' } : {}) } }, { onSuccess: () => toast.success('Tracking saved') }); }} />
            </div>
          </div>
          <div className="flex md:flex-col gap-2">
            {r.status !== 'Confirmed' && <Button size="sm" onClick={() => save.mutate({ id: r.id, record: { status: 'Confirmed', ...(!r.deliveryStatus || r.deliveryStatus === 'Awaiting Payment Check' ? { deliveryStatus: 'Preparing' } : {}) } }, { onSuccess: () => toast.success('Confirmed') })}><Check className="h-4 w-4" />Confirm</Button>}
            {r.status === 'Pending' && <Button size="sm" variant="outline" onClick={() => save.mutate({ id: r.id, record: { status: 'Rejected' } })}><X className="h-4 w-4" />Reject</Button>}
            {r.paymentScreenshot && <Button size="sm" variant="ghost" asChild><a href={r.paymentScreenshot} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Proof</a></Button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SubscriptionsAdmin() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl md:text-3xl font-bold">Subscriptions</h1>
      <Tabs defaultValue="requests">
        <TabsList className="w-full sm:w-auto overflow-x-auto justify-start"><TabsTrigger value="requests">Requests</TabsTrigger><TabsTrigger value="plans">Plans & prices</TabsTrigger><TabsTrigger value="payment">Payment QR</TabsTrigger></TabsList>
        <TabsContent value="requests" className="pt-4"><Requests /></TabsContent>
        <TabsContent value="plans" className="pt-4">
          <CrudPage table="subscriptionPlans" title="Plans" titleKey="name" visibleKey="visible" defaults={{ visible: true }}
            sort={(a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)} subtitle={(r) => `₹${r.price ?? 0} · ${r.duration ?? ''}`}
            fields={[{ key: 'name', label: 'Plan name', type: 'text', required: true }, { key: 'price', label: 'Price (₹)', type: 'number', required: true }, { key: 'duration', label: 'Duration (e.g. 1 Year)', type: 'text' }, { key: 'sortOrder', label: 'Order', type: 'number' }, { key: 'visible', label: 'Visible', type: 'checkbox' }, { key: 'features', label: 'Features (one per line)', type: 'textarea' }]} />
        </TabsContent>
        <TabsContent value="payment" className="pt-4">
          <SettingsForm title="Payment & visibility" fields={[
            { key: 'showSubscribe', label: 'Show Subscribe section on website', type: 'checkbox' },
            { key: 'upiId', label: 'UPI ID', type: 'text' }, { key: 'paymentQr', label: 'Payment QR code image', type: 'image' },
            { key: 'paymentNote', label: 'Payment instructions', type: 'textarea' },
          ]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

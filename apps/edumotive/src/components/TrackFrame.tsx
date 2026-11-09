import { useState } from 'react';
import { ExternalLink, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@project/components/ui/button';

export const TRACK_URL = 'https://myspeedpost.com/';

export default function TrackFrame({ trackingNumber }: { trackingNumber: string }) {
  const [loaded, setLoaded] = useState(false);
  const [big, setBig] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Paste <strong className="font-mono text-foreground">{trackingNumber}</strong> into the box below and press Track.</span>
        <Button size="sm" variant="ghost" className="ml-auto h-7" onClick={() => setBig(!big)}>{big ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}{big ? 'Smaller' : 'Bigger'}</Button>
        <Button size="sm" variant="ghost" className="h-7" asChild><a href={TRACK_URL} target="_blank" rel="noreferrer">Open<ExternalLink className="h-3.5 w-3.5" /></a></Button>
      </div>
      <div
        key={big ? 'big' : 'small'}
        className="relative w-full overflow-hidden rounded-xl border bg-background shadow-inner"
        style={{ height: big ? 640 : 380, resize: 'vertical', minHeight: 240, maxHeight: '90vh' }}
      >
        {!loaded && <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading tracker…</div>}
        <iframe src={TRACK_URL} title="Speed Post tracking" onLoad={() => setLoaded(true)} className="h-full w-full" />
      </div>
      <p className="text-[11px] text-muted-foreground">Drag the bottom-right corner to resize.</p>
    </div>
  );
}

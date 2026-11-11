import { getSession } from '../lib/auth';
import { useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Textarea } from '@project/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@project/components/ui/dialog';
import { postAction, stories } from 'zitejs/api';

type Props = { open: boolean; onOpenChange: (o: boolean) => void; onDone: () => void; mode?: 'post' | 'status' };

export default function NewPost({ open, onOpenChange, onDone, mode = 'post' }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const [media, setMedia] = useState<{ url: string; type: 'Image' | 'Video' } | null>(null);
  const [caption, setCaption] = useState('');
  const [campus, setCampus] = useState('');
  const [busy, setBusy] = useState(false);
  const isStatus = mode === 'status';
  const reset = () => { setMedia(null); setCaption(''); setCampus(''); };
  const submit = async () => {
    if (!media) return;
    setBusy(true);
    try {
      if (isStatus) await stories({ session: getSession(),  action: 'create', media: media.url, mediaType: media.type, caption });
      else await postAction({ session: getSession(),  action: 'create', image: media.url, mediaType: media.type, caption, campus });
      toast.success(isStatus ? 'Status added' : 'Shared!'); reset(); onOpenChange(false); onDone();
    } catch { toast.error('Could not share'); } finally { setBusy(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md glass-dialog">
        <DialogHeader><DialogTitle className="font-display text-2xl">{isStatus ? 'Add status' : 'New post'}</DialogTitle><DialogDescription>{isStatus ? 'Photo or video · disappears after 24 hours' : 'Share a photo or video with your campus'}</DialogDescription></DialogHeader>
        {media ? (
          <div className="relative rounded-2xl overflow-hidden bg-muted">
            {media.type === 'Video' ? <video src={media.url} controls className="w-full max-h-[50vh] object-contain" /> : <img src={media.url} alt="" className="w-full max-h-[50vh] object-contain" />}
            <button onClick={() => setMedia(null)} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <button onClick={() => ref.current?.click()} className="aspect-[4/3] w-full rounded-2xl border-2 border-dashed bg-muted/40 flex items-center justify-center">
            {isUploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <span className="flex flex-col items-center gap-2 text-muted-foreground"><ImagePlus className="h-10 w-10" />Choose a photo or video</span>}
          </button>
        )}
        <input ref={ref} type="file" accept="image/*,video/*" hidden onChange={async (e) => {
          const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
          try { setMedia({ url: (await upload(f)).url, type: f.type.startsWith('video') ? 'Video' : 'Image' }); } catch { toast.error('Upload failed'); }
        }} />
        <Textarea placeholder="Write a caption…" value={caption} onChange={(e) => setCaption(e.target.value)} rows={isStatus ? 2 : 3} />
        {!isStatus && <Input placeholder="Campus (defaults to your institution)" value={campus} onChange={(e) => setCampus(e.target.value)} />}
        <DialogFooter><Button className="w-full rounded-full" disabled={!media || busy || isUploading} onClick={submit}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}{isStatus ? 'Add to status' : 'Share'}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

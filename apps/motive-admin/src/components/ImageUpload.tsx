import { useRef } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';

const isVideoUrl = (u: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(u);
const MAX_MB = 20;

export default function ImageUpload({ value, onChange, label = 'Upload image', accept = 'image/*' }: { value: string; onChange: (url: string) => void; label?: string; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const media = accept.startsWith('image');
  const wide = accept.includes('video');

  const onFile = async (f: File) => {
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File is ${(f.size / 1048576).toFixed(1)} MB — max ${MAX_MB} MB. Compress it or paste a link instead.`);
      return;
    }
    const id = toast.loading(`Uploading ${f.name}…`);
    let last: unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { url } = await upload(f, f.name);
        onChange(url);
        toast.success('Uploaded', { id });
        return;
      } catch (e) {
        last = e;
        console.error(`Upload attempt ${attempt} failed`, e);
        if (attempt < 3) { toast.loading(`Connection hiccup — retrying (${attempt + 1}/3)…`, { id }); await new Promise((r) => setTimeout(r, 1500 * attempt)); }
      }
    }
    const msg = last instanceof Error ? last.message : 'unknown error';
    toast.error(/fetch/i.test(msg)
      ? 'Upload blocked by the network or browser. Turn off ad-blockers/VPN or try on the published admin site, or paste a link instead.'
      : `Upload failed: ${msg}`, { id, duration: 10000 });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {value && media && (isVideoUrl(value)
        ? <video src={value} muted playsInline className="h-16 w-28 rounded-lg object-cover border bg-black" />
        : <img src={value} alt="" className={`${wide ? 'h-16 w-28' : 'h-16 w-16'} rounded-lg object-cover border`} />)}
      {value && !media && <span className="text-xs text-muted-foreground truncate max-w-[200px]">File uploaded ✓</span>}
      <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => ref.current?.click()}>
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {isUploading ? 'Uploading…' : value ? 'Replace' : label}
      </Button>
      {value && !isUploading && <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}><X className="h-4 w-4" /> Remove</Button>}
      <input ref={ref} type="file" accept={accept} hidden onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) onFile(f);
      }} />
    </div>
  );
}

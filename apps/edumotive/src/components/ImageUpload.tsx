import { useRef } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';

export default function ImageUpload({ value, onChange, label = 'Upload image', accept = 'image/*' }: { value: string; onChange: (url: string) => void; label?: string; accept?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const isImage = accept.startsWith('image');
  return (
    <div className="flex items-center gap-3">
      {value && isImage && <img src={value} alt="" className="h-16 w-16 rounded-lg object-cover border" />}
      {value && !isImage && <span className="text-xs text-muted-foreground truncate max-w-[200px]">File uploaded ✓</span>}
      <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => ref.current?.click()}>
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {value ? 'Replace' : label}
      </Button>
      <input ref={ref} type="file" accept={accept} hidden onChange={async (e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        try { onChange((await upload(f)).url); } catch { toast.error('Upload failed'); }
      }} />
    </div>
  );
}

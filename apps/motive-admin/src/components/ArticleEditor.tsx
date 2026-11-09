import { useRef, useState } from 'react';
import { Bold, Heading2, Heading3, ImagePlus, Italic, List, Loader2, Quote, Link2 } from 'lucide-react';
import { useUpload } from 'zitejs/upload';
import { toast } from 'sonner';
import { Button } from '@project/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@project/components/ui/tabs';
import MarkdownArticle from './MarkdownArticle';

export default function ArticleEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, isUploading } = useUpload();
  const [caption, setCaption] = useState('');

  const wrap = (before: string, after = '', line = false) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: s, selectionEnd: e } = ta;
    const sel = value.slice(s, e) || 'text';
    const pre = line && s > 0 && value[s - 1] !== '\n' ? '\n' : '';
    const next = value.slice(0, s) + pre + before + sel + after + value.slice(e);
    onChange(next);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = s + pre.length + before.length; ta.selectionEnd = ta.selectionStart + sel.length; });
  };

  const insertImage = async (file: File) => {
    try {
      const { url } = await upload(file);
      const pos = ref.current?.selectionStart ?? value.length;
      const md = `\n\n![${caption || 'Fig.'}](${url})\n\n`;
      onChange(value.slice(0, pos) + md + value.slice(pos));
      setCaption('');
    } catch {
      toast.error('Image upload failed');
    }
  };

  const tools = [
    { icon: Heading2, label: 'Heading', fn: () => wrap('## ', '', true) },
    { icon: Heading3, label: 'Sub-heading', fn: () => wrap('### ', '', true) },
    { icon: Bold, label: 'Bold', fn: () => wrap('**', '**') },
    { icon: Italic, label: 'Italic', fn: () => wrap('*', '*') },
    { icon: Quote, label: 'Quote', fn: () => wrap('> ', '', true) },
    { icon: List, label: 'List', fn: () => wrap('- ', '', true) },
    { icon: Link2, label: 'Link', fn: () => wrap('[', '](https://)') },
  ];

  return (
    <Tabs defaultValue="write" className="w-full">
      <TabsList><TabsTrigger value="write">Write</TabsTrigger><TabsTrigger value="preview">Preview</TabsTrigger></TabsList>
      <TabsContent value="write" className="space-y-2">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-background/60 p-1">
          {tools.map((t) => (
            <Button key={t.label} type="button" variant="ghost" size="icon" title={t.label} onClick={t.fn}><t.icon className="h-4 w-4" /></Button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Figure caption (optional)" className="h-8 rounded-md border bg-background px-2 text-xs w-44" />
            <Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => fileRef.current?.click()}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} Image
            </Button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) insertImage(f); e.target.value = ''; }} />
          </div>
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={'Start writing… Use "## Heading" for sections — they appear in the table of contents.'}
          className="w-full min-h-[420px] rounded-lg border bg-background/70 p-4 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="rounded-lg border bg-background/70 p-6 min-h-[420px]">
          {value ? <MarkdownArticle content={value} /> : <p className="text-muted-foreground">Nothing to preview yet.</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}

import { getSession } from '../lib/auth';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getMyProfile, submitArticle } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Textarea } from '@project/components/ui/textarea';
import RequireAuth from '../components/RequireAuth';
import ArticleEditor from '../components/ArticleEditor';
import ImageUpload from '../components/ImageUpload';
import { useContent } from '../lib/content';

export default function WritePage() {
  return <RequireAuth><Write /></RequireAuth>;
}

function Write() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['me'], queryFn: () => getMyProfile({ session: getSession() }) });
  const { data: content } = useContent();
  const [f, setF] = useState({ title: '', excerpt: '', content: '', coverImage: '', section: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const a = data?.articles.find((x) => x.id === id);
    if (a) setF({ title: a.title, excerpt: a.excerpt, content: a.content, coverImage: a.coverImage, section: a.section });
  }, [data, id]);

  if (isLoading) return <div className="py-24 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!data?.profile) return (
    <div className="container mx-auto px-4 py-20 max-w-lg"><div className="glass p-8 text-center space-y-3">
      <h1 className="text-2xl font-bold">Set up your profile first</h1><p className="text-muted-foreground">Tell us your class and institution before submitting work.</p>
      <Button asChild><Link to="/account">Complete profile</Link></Button>
    </div></div>
  );

  const submit = async (asDraft: boolean) => {
    if (!f.title.trim() || !f.content.trim()) { toast.error('Title and content are required'); return; }
    setBusy(true);
    try {
      await submitArticle({ session: getSession(),  ...f, id, asDraft });
      await qc.invalidateQueries({ queryKey: ['me'] });
      toast.success(asDraft ? 'Draft saved' : 'Submitted! The editors will review it soon.');
      nav('/account');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not submit'); } finally { setBusy(false); }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl">
      <div className="glass p-6 md:p-8 space-y-5">
        <h1 className="text-3xl font-bold">{id ? 'Edit your work' : 'Submit your work'}</h1>
        <div className="space-y-1.5"><Label>Title *</Label><Input className="text-lg font-serif" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Category / section</Label><select value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} className="h-9 w-full rounded-md border bg-background px-3 text-sm"><option value="">Choose a section</option>{(content?.sections ?? []).map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div>
          <div className="space-y-1.5"><Label>Main image</Label><ImageUpload value={f.coverImage} onChange={(coverImage) => setF({ ...f, coverImage })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Short summary</Label><Textarea value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} /></div>
        <ArticleEditor value={f.content} onChange={(content) => setF({ ...f, content })} />
        <div className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" disabled={busy} onClick={() => submit(true)}>Save draft</Button>
          <Button disabled={busy} onClick={() => submit(false)}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit for review</Button>
        </div>
      </div>
    </div>
  );
}

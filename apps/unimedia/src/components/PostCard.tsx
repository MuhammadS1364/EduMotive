import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Send, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useAuth, loginWithRedirect, getSession } from '../lib/auth';
import { postAction, GetFeedOutputType } from 'zitejs/api';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { cn } from '@project/components/lib/utils';

type Post = GetFeedOutputType['posts'][0];

export default function PostCard({ post, refresh }: { post: Post; refresh: () => void }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likes, setLikes] = useState(post.likes);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const need = () => { if (!user) { loginWithRedirect(); return true; } return false; };

  const like = async () => {
    if (need()) return;
    setLiked(!liked); setLikes(likes + (liked ? -1 : 1));
    try { await postAction({ session: getSession(),  action: 'like', postId: post.id }); } catch { setLiked(liked); setLikes(likes); toast.error('Could not like'); }
  };
  const comment = async () => {
    if (need() || !text.trim()) return;
    try { await postAction({ session: getSession(),  action: 'comment', postId: post.id, text }); setText(''); refresh(); } catch { toast.error('Could not comment'); }
  };
  const remove = async () => { try { await postAction({ session: getSession(),  action: 'delete', postId: post.id }); refresh(); } catch { toast.error('Could not delete'); } };
  const when = post.created ? formatDistanceToNow(new Date(post.created), { addSuffix: true }) : '';
  const share = async () => {
    const url = `${window.location.origin}/p/${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${post.authorName} on UniMedia`, text: post.caption, url });
      else { await navigator.clipboard.writeText(url); toast.success('Link copied'); }
    } catch { /* share dismissed */ }
  };

  return (
    <article className="glass overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <Link to={`/u/${post.authorId}`} className="h-10 w-10 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-card block"><div className="h-full w-full rounded-full bg-card overflow-hidden flex items-center justify-center font-bold text-sm">{post.authorAvatar ? <img src={post.authorAvatar} alt="" className="h-full w-full object-cover" /> : post.authorName[0]}</div></Link>
        <div className="flex-1 min-w-0"><Link to={`/u/${post.authorId}`} className="font-semibold text-sm truncate block hover:underline">{post.authorName}</Link><p className="text-xs text-muted-foreground truncate">{post.institution || when}</p></div>
        {post.mine && <Button size="icon" variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" /></Button>}
      </div>
      {post.mediaType === 'Video'
        ? <video src={post.image} controls playsInline preload="metadata" className="w-full h-auto max-h-[80vh] bg-black" />
        : <img src={post.image} alt="" className="w-full h-auto max-h-[80vh] object-contain bg-muted/40" onDoubleClick={() => !liked && like()} />}
      <div className="p-3 space-y-2">
        <div className="flex gap-4">
          <button onClick={like} aria-label="Like"><Heart className={cn('h-6 w-6 transition-transform active:scale-125', liked && 'fill-red-500 text-red-500')} /></button>
          <button onClick={() => setOpen(!open)} aria-label="Comments"><MessageCircle className="h-6 w-6" /></button>
          <button onClick={share} aria-label="Share"><Share2 className="h-6 w-6" /></button>
        </div>
        <p className="text-sm font-semibold">{likes} like{likes === 1 ? '' : 's'}</p>
        {post.caption && <p className="text-sm"><span className="font-semibold mr-1">{post.authorName}</span>{post.caption}</p>}
        {post.comments.length > 0 && !open && <button onClick={() => setOpen(true)} className="text-sm text-muted-foreground">View all {post.comments.length} comments</button>}
        {open && <div className="space-y-1">{post.comments.map((c) => <p key={c.id} className="text-sm"><span className="font-semibold mr-1">{c.authorName}</span>{c.text}</p>)}</div>}
        <p className="text-[11px] uppercase text-muted-foreground">{when}</p>
        <div className="flex gap-2 border-t pt-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && comment()} placeholder="Add a comment…" className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0" />
          <Button size="icon" variant="ghost" disabled={!text.trim()} onClick={comment}><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    </article>
  );
}

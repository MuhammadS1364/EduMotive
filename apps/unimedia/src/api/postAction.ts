import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from '../lib/db';

const arr = (v: string | string[] | undefined) => [v].flat().filter((x): x is string => !!x);

export default createEndpoint({
  description: 'Creates, likes, comments on or deletes a UniMedia post for the signed-in student',
  authenticated: true,
  inputSchema: z.object({
    action: z.enum(['create', 'like', 'comment', 'delete']),
    postId: z.string().optional(),
    image: z.string().optional(),
    caption: z.string().optional(),
    mediaType: z.enum(['Image', 'Video']).optional(),
    campus: z.string().optional(),
    text: z.string().optional(),
  }),
  outputSchema: z.object({ ok: z.boolean() }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    const profile = await zite.profiles.findOne({ filters: { user: uid } });
    const name = profile?.name || [context.user.firstName, context.user.lastName].filter(Boolean).join(' ') || context.user.email.split('@')[0];
    if (input.action === 'create') {
      if (!input.image) throw new ZiteError('Please add a photo or video.');
      await zite.posts.create({ record: { image: input.image, mediaType: input.mediaType ?? 'Image', caption: input.caption ?? '', author: uid, authorName: name, institution: input.campus?.trim() || profile?.institution || '', hidden: false } });
      return { ok: true };
    }
    const post = input.postId ? await zite.posts.findOne({ id: input.postId }) : null;
    if (!post) throw new ZiteError('Post not found.');
    if (input.action === 'like') {
      const liked = arr(post.likedBy);
      await zite.posts.update({ id: post.id, record: { likedBy: liked.includes(uid) ? liked.filter((x) => x !== uid) : [...liked, uid] } });
    } else if (input.action === 'comment') {
      if (!input.text?.trim()) throw new ZiteError('Comment is empty.');
      await zite.comments.create({ record: { text: input.text.trim(), post: post.id, author: uid, authorName: name } });
    } else {
      if (arr(post.author)[0] !== uid) throw new ZiteError('You can only delete your own posts.');
      await zite.posts.delete({ id: post.id });
    }
    return { ok: true };
  },
});

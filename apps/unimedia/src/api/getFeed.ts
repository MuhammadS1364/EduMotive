import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';

const arr = (v: string | string[] | undefined) => [v].flat().filter((x): x is string => !!x);

export default createEndpoint({
  description: 'Loads the UniMedia feed of visible posts with likes and comments',
  inputSchema: z.object({}),
  outputSchema: z.object({
    posts: z.array(z.object({
      id: z.string(), authorId: z.string(), caption: z.string(), image: z.string(), mediaType: z.enum(['Image', 'Video']), authorName: z.string(), authorAvatar: z.string(), institution: z.string(),
      created: z.string(), likes: z.number(), likedByMe: z.boolean(), mine: z.boolean(),
      comments: z.array(z.object({ id: z.string(), text: z.string(), authorName: z.string(), created: z.string() })),
    })),
  }),
  execute: async ({ context }) => {
    const me = context.user?.id;
    const [p, c, pr] = await Promise.all([
      zite.posts.findAll({ filters: { hidden: false }, limit: 300 }),
      zite.comments.findAll({ limit: 2000 }),
      zite.profiles.findAll({ limit: 2000, fields: ['user', 'avatar'] }),
    ]);
    const avatars = new Map(pr.records.map((x) => [arr(x.user)[0], x.avatar ?? '']));
    const posts = p.records.filter((x) => !x.hidden).map((x) => {
      const author = arr(x.author)[0];
      const liked = arr(x.likedBy);
      return {
        id: x.id, authorId: author ?? '', caption: x.caption ?? '', image: x.image ?? '', mediaType: x.mediaType === 'Video' ? 'Video' as const : 'Image' as const, authorName: x.authorName ?? 'Student', authorAvatar: avatars.get(author) ?? '',
        institution: x.institution ?? '', created: x.created ?? '', likes: liked.length, likedByMe: !!me && liked.includes(me), mine: !!me && author === me,
        comments: c.records.filter((m) => arr(m.post).includes(x.id)).map((m) => ({ id: m.id, text: m.text ?? '', authorName: m.authorName ?? '', created: m.created ?? '' })).sort((a, b) => a.created.localeCompare(b.created)),
      };
    }).sort((a, b) => b.created.localeCompare(a.created));
    return { posts };
  },
});

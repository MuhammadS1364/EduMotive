import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireUser } from '../lib/auth.server';

const arr = (v: string | string[] | undefined) => [v].flat().filter((x): x is string => !!x);

export default createEndpoint({
  description: 'Gets a UniMedia profile (yours if no id) with their posts, or saves your own profile',
  inputSchema: z.object({ session: z.string().optional(),
    userId: z.string().optional(),
    save: z.object({ name: z.string().min(1), institution: z.string(), class: z.string(), bio: z.string(), avatar: z.string(), role: z.enum(['Student', 'Author']).optional() }).optional(),
  }),
  outputSchema: z.object({
    userId: z.string(), isMe: z.boolean(),
    profile: z.object({ name: z.string(), institution: z.string(), class: z.string(), bio: z.string(), avatar: z.string(), role: z.string() }).nullable(),
    posts: z.array(z.object({ id: z.string(), image: z.string(), video: z.boolean(), likes: z.number(), comments: z.number() })),
  }),
  execute: async ({ input }) => {
    const user = await requireUser(input.session);
    const uid = input.userId || user.id;
    const isMe = uid === user.id;
    let p = await zite.profiles.findOne({ filters: { user: uid } });
    if (isMe && input.save) {
      const { role, ...rest } = input.save;
      if (p) { await zite.profiles.update({ id: p.id, record: role ? { ...rest, role } : rest }); }
      else { await zite.profiles.create({ record: { ...rest, user: uid, role: role ?? 'Student' } }); }
      p = await zite.profiles.findOne({ filters: { user: uid } });
    }
    const { records } = await zite.posts.findAll({ filters: { author: uid }, limit: 300 });
    return {
      userId: uid, isMe,
      profile: p ? { name: p.name ?? '', institution: p.institution ?? '', class: p.class ?? '', bio: p.bio ?? '', avatar: p.avatar ?? '', role: String(p.role ?? 'Student') } : null,
      posts: records.filter((r) => !r.hidden).sort((a, b) => String(b.created).localeCompare(String(a.created)))
        .map((r) => ({ id: r.id, image: r.image ?? '', video: r.mediaType === 'Video', likes: arr(r.likedBy).length, comments: arr(r.comments).length })),
    };
  },
});

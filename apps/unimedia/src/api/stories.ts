import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

const arr = (v: string | string[] | undefined) => [v].flat().filter((x): x is string => !!x);

export default createEndpoint({
  description: 'Lists status stories from the last 24 hours, or adds/deletes your own status',
  authenticated: true,
  inputSchema: z.object({
    action: z.enum(['list', 'create', 'delete']),
    media: z.string().optional(),
    mediaType: z.enum(['Image', 'Video']).optional(),
    caption: z.string().optional(),
    storyId: z.string().optional(),
  }),
  outputSchema: z.object({
    groups: z.array(z.object({
      authorId: z.string(), authorName: z.string(), avatar: z.string(), mine: z.boolean(),
      items: z.array(z.object({ id: z.string(), media: z.string(), mediaType: z.enum(['Image', 'Video']), caption: z.string(), created: z.string() })),
    })),
  }),
  execute: async ({ input, context }) => {
    const uid = context.user.id;
    if (input.action === 'create') {
      if (!input.media) throw new ZiteError('Please add a photo or video.');
      const p = await zite.profiles.findOne({ filters: { user: uid } });
      const name = p?.name || context.user.firstName || context.user.email?.split('@')[0] || 'Student';
      await zite.stories.create({ record: { media: input.media, mediaType: input.mediaType ?? 'Image', caption: input.caption ?? '', author: uid, authorName: name } });
    } else if (input.action === 'delete' && input.storyId) {
      const s = await zite.stories.findOne({ id: input.storyId });
      if (!s || arr(s.author)[0] !== uid) throw new ZiteError('You can only delete your own status.');
      await zite.stories.delete({ id: s.id });
    }
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [{ records }, pr] = await Promise.all([
      zite.stories.findAll({ limit: 500 }),
      zite.profiles.findAll({ limit: 2000, fields: ['user', 'avatar'] }),
    ]);
    const avatars = new Map(pr.records.map((x) => [arr(x.user)[0], x.avatar ?? '']));
    const map = new Map<string, { authorId: string; authorName: string; avatar: string; mine: boolean; items: { id: string; media: string; mediaType: 'Image' | 'Video'; caption: string; created: string }[] }>();
    records.filter((s) => (s.created ?? '') >= since && s.media).sort((a, b) => String(a.created).localeCompare(String(b.created))).forEach((s) => {
      const a = arr(s.author)[0] ?? '';
      if (!map.has(a)) map.set(a, { authorId: a, authorName: s.authorName ?? 'Student', avatar: avatars.get(a) ?? '', mine: a === uid, items: [] });
      map.get(a)!.items.push({ id: s.id, media: s.media!, mediaType: s.mediaType === 'Video' ? 'Video' : 'Image', caption: s.caption ?? '', created: s.created ?? '' });
    });
    const groups = [...map.values()].sort((a, b) => Number(b.mine) - Number(a.mine));
    return { groups };
  },
});

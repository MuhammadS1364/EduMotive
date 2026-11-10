import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Returns the signed-in member profile and their submitted articles',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    profile: z.object({ name: z.string(), role: z.string(), class: z.string(), institution: z.string(), bio: z.string(), avatar: z.string() }).nullable(),
    articles: z.array(z.object({ id: z.string(), title: z.string(), status: z.string(), created: z.string(), section: z.string(), excerpt: z.string(), coverImage: z.string(), content: z.string() })),
  }),
  execute: async ({ context }) => {
    const p = await zite.profiles.findOne({ filters: { user: context.user.id } });
    const [byUser, byProfile] = await Promise.all([
      zite.articles.findAll({ filters: { author: context.user.id }, limit: 500 }),
      p?.id ? zite.articles.findAll({ filters: { authorProfile: p.id }, limit: 500 }) : Promise.resolve({ records: [] }),
    ]);
    const map = new Map<string, (typeof byUser.records)[0]>();
    byUser.records.forEach((x) => map.set(x.id, x));
    byProfile.records.forEach((x) => map.set(x.id, x));
    const allArticles = Array.from(map.values());

    return {
      profile: p ? { name: p.name ?? '', role: p.role ?? 'Student', class: p.class ?? '', institution: p.institution ?? '', bio: p.bio ?? '', avatar: p.avatar ?? '' } : null,
      articles: allArticles
        .map((x) => ({ id: x.id, title: x.title ?? '', status: x.status ?? '', created: x.created ?? '', section: x.section ?? '', excerpt: x.excerpt ?? '', coverImage: x.coverImage ?? '', content: x.content ?? '' }))
        .sort((x, y) => y.created.localeCompare(x.created)),
    };
  },
});

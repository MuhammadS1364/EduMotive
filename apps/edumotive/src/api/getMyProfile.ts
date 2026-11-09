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
    const [p, a] = await Promise.all([
      zite.profiles.findOne({ filters: { user: context.user.id } }),
      zite.articles.findAll({ filters: { author: context.user.id }, limit: 500 }),
    ]);
    return {
      profile: p ? { name: p.name ?? '', role: p.role ?? 'Student', class: p.class ?? '', institution: p.institution ?? '', bio: p.bio ?? '', avatar: p.avatar ?? '' } : null,
      articles: a.records
        .map((x) => ({ id: x.id, title: x.title ?? '', status: x.status ?? '', created: x.created ?? '', section: x.section ?? '', excerpt: x.excerpt ?? '', coverImage: x.coverImage ?? '', content: x.content ?? '' }))
        .sort((x, y) => y.created.localeCompare(x.created)),
    };
  },
});

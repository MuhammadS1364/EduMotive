import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';

const Item = z.object({ id: z.string(), title: z.string(), summary: z.string(), body: z.string(), media: z.string(), category: z.string(), publishedAt: z.string(), pinned: z.boolean() });

export default createEndpoint({
  description: 'Lists published news and updates',
  inputSchema: z.object({}),
  outputSchema: z.object({ news: z.array(Item) }),
  execute: async () => {
    const { records } = await zite.news.findAll({ filters: { visible: true }, sort: [{ field: 'publishedAt', direction: 'desc' }], limit: 200 });
    const news = records.map((r) => ({
      id: r.id, title: r.title ?? '', summary: r.summary ?? '', body: r.body ?? '', media: r.media ?? '',
      category: r.category ?? '', publishedAt: r.publishedAt ?? '', pinned: !!r.pinned,
    }));
    news.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    return { news };
  },
});

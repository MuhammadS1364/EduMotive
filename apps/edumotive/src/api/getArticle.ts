import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Loads one published article (or your own draft) for reading',
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({
    id: z.string(), title: z.string(), excerpt: z.string(), content: z.string(), coverImage: z.string(),
    section: z.string(), authorName: z.string(), authorId: z.string(), publishedAt: z.string(), status: z.string(),
  }),
  execute: async ({ input, context }) => {
    const a = await zite.articles.findOne({ id: input.id });
    const authorIds = a ? [a.author].flat().filter(Boolean) : [];
    const mine = !!context.user && authorIds.includes(context.user.id);
    if (!a || (a.status !== 'Published' && !mine)) {
      throw new ZiteError('This article is not available.');
    }
    const profId = [a.authorProfile].flat().filter(Boolean)[0] as string | undefined;
    let authorId = (authorIds[0] as string) ?? '';
    if (profId) { const p = await zite.profiles.findOne({ id: profId }); authorId = ([p?.user].flat().filter(Boolean)[0] as string) || profId; }
    return {
      id: a.id, title: a.title ?? '', excerpt: a.excerpt ?? '', content: a.content ?? '', coverImage: a.coverImage ?? '',
      section: a.section ?? '', authorName: a.authorName ?? '', authorId, publishedAt: a.publishedAt ?? a.created ?? '', status: a.status ?? '',
    };
  },
});

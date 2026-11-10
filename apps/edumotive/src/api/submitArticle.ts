import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from '../lib/db';

export default createEndpoint({
  description: 'Submits (or saves as draft) an article from a student or author for admin approval',
  authenticated: true,
  inputSchema: z.object({
    id: z.string().optional(),
    title: z.string().min(1), excerpt: z.string(), content: z.string().min(1), coverImage: z.string(), section: z.string(),
    asDraft: z.boolean(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    const profile = await zite.profiles.findOne({ filters: { user: context.user.id } });
    const authorName = profile?.name || `${context.user.firstName ?? ''} ${context.user.lastName ?? ''}`.trim() || context.user.email;
    const record = {
      title: input.title, excerpt: input.excerpt, content: input.content, coverImage: input.coverImage, section: input.section,
      authorName, author: context.user.id, status: input.asDraft ? 'Draft' : 'Pending',
    };
    if (input.id) {
      const existing = await zite.articles.findOne({ id: input.id });
      if (!existing || ![existing.author].flat().includes(context.user.id)) {
        throw new ZiteError('You can only edit your own work.');
      }
      if (existing.status === 'Published') {
        throw new ZiteError('Published articles can only be edited by the editors.');
      }
      await zite.articles.update({ id: input.id, record });
      return { id: input.id };
    }
    const created = await zite.articles.create({ record: { ...record, featured: false, publishedAt: null } });
    return { id: created.id };
  },
});

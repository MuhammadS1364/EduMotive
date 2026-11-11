import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireUser } from '../lib/auth.server';

export default createEndpoint({
  description: 'Creates or updates the signed-in member profile (class, institution, student or author)',
  inputSchema: z.object({ session: z.string().optional(),
    name: z.string().min(1), role: z.enum(['Student', 'Author']), class: z.string(), institution: z.string().min(1),
    bio: z.string().optional(), avatar: z.string().optional(),
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const user = await requireUser(input.session);
    await zite.profiles.bulkCreate({
      records: [{ user: user.id, name: input.name, role: input.role, class: input.class, institution: input.institution, bio: input.bio ?? '', avatar: input.avatar ?? '' }],
      matchOn: ['user'],
    });
    return { success: true };
  },
});

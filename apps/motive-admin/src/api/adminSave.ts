import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireAdmin, TABLES } from '../lib/adminAuth';
import { syncAuthorBadges } from '../lib/badges';

export default createEndpoint({
  description: 'Creates or updates a content record from the admin panel',
  authenticated: true,
  inputSchema: z.object({ table: z.enum(TABLES), id: z.string().optional(), record: z.record(z.any()) }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input, context }) => {
    requireAdmin(context.user);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = zite[input.table] as any;
    if (input.id) {
      await client.update({ id: input.id, record: input.record });
      if (input.table === 'articles' && input.record.status === 'Published') await syncAuthorBadges(input.id);
      return { id: input.id };
    }
    const created = await client.create({ record: input.record });
    return { id: created.id as string };
  },
});

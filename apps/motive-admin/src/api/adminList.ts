import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireAdmin, TABLES } from '../lib/adminAuth';

export default createEndpoint({
  description: 'Lists all records of a content table for the admin panel',
  authenticated: true,
  inputSchema: z.object({ table: z.enum(TABLES) }),
  outputSchema: z.object({ records: z.array(z.record(z.any())) }),
  execute: async ({ input, context }) => {
    requireAdmin(context.user);
    const { records } = await zite[input.table].findAll({ limit: 2000 });
    return { records: records as Record<string, unknown>[] };
  },
});

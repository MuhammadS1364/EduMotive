import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireAdmin, TABLES } from '../lib/adminAuth';

export default createEndpoint({
  description: 'Deletes a content record from the admin panel',
  authenticated: true,
  inputSchema: z.object({ table: z.enum(TABLES), id: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    requireAdmin(context.user);
    await zite[input.table].delete({ id: input.id });
    return { success: true };
  },
});

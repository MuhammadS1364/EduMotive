import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';
import { requireAdmin, TABLES } from '../lib/adminAuth';

export default createEndpoint({
  description: 'Deletes a content record from the admin panel',
  inputSchema: z.object({ token: z.string(), table: z.enum(TABLES), id: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    requireAdmin(input.token);
    await zite[input.table].delete({ id: input.id });
    return { success: true };
  },
});

import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireAdmin } from '../lib/adminAuth';

export default createEndpoint({
  description: 'Saves site settings such as vision, mission, team photo and payment QR',
  authenticated: true,
  inputSchema: z.object({ settings: z.record(z.string()) }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input, context }) => {
    requireAdmin(context.user);
    const records = Object.entries(input.settings).map(([key, value]) => ({ key, value }));
    if (records.length) await zite.siteSettings.bulkCreate({ records, matchOn: ['key'] });
    return { success: true };
  },
});

import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireAdmin } from '../lib/adminAuth';

export default createEndpoint({
  description: 'Counts key numbers for the admin dashboard',
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({ stats: z.record(z.number()) }),
  execute: async ({ context }) => {
    requireAdmin(context.user);
    const { rows } = await zite.sql({
      query: `SELECT
        (SELECT COUNT(*) FROM "Articles" WHERE "status" = 'Published') AS "published",
        (SELECT COUNT(*) FROM "Articles" WHERE "status" = 'Pending') AS "pending",
        (SELECT COUNT(*) FROM "Issues") AS "issues",
        (SELECT COUNT(*) FROM "Programs") AS "programs",
        (SELECT COUNT(*) FROM "Subscriptions" WHERE "status" = 'Pending') AS "pendingSubs",
        (SELECT COUNT(*) FROM "Subscriptions" WHERE "status" = 'Confirmed') AS "activeSubs",
        (SELECT COUNT(*) FROM "Posts") AS "posts",
        (SELECT COUNT(*) FROM "Profiles") AS "members"`,
    });
    const stats: Record<string, number> = {};
    Object.entries(rows[0] ?? {}).forEach(([k, v]) => { stats[k] = Number(v) || 0; });
    return { stats };
  },
});

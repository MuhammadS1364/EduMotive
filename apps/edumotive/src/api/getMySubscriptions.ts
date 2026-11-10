import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from '../lib/db';

export default createEndpoint({
  description: "Lists the signed-in member's print subscription orders with delivery tracking",
  authenticated: true,
  inputSchema: z.object({}),
  outputSchema: z.object({
    orders: z.array(z.object({ id: z.string(), planName: z.string(), amount: z.number(), status: z.string(), deliveryStatus: z.string(), trackingNumber: z.string(), created: z.string(), address: z.string() })),
  }),
  execute: async ({ context }) => {
    const { records } = await zite.subscriptions.findAll({ filters: { subscriber: context.user.id }, limit: 100 });
    return {
      orders: records.map((r) => ({ id: r.id, planName: r.planName || r.plan || '', amount: r.amount ?? 0, status: r.status ?? 'Pending', deliveryStatus: r.deliveryStatus ?? 'Awaiting Payment Check', trackingNumber: r.trackingNumber ?? '', created: r.created ?? '', address: r.address ?? '' }))
        .sort((a, b) => b.created.localeCompare(a.created)),
    };
  },
});

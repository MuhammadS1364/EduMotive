import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from '../lib/db';
import { requireUser } from '../lib/auth.server';

export default createEndpoint({
  description: 'Records a print subscription order with payment proof for the signed-in member',
  inputSchema: z.object({ session: z.string().optional(),
    name: z.string().min(1), email: z.string().email(), phone: z.string().min(6), address: z.string().min(5),
    planId: z.string(), transactionId: z.string().min(3), paymentScreenshot: z.string().url(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ input }) => {
    const user = await requireUser(input.session);
    const profile = await zite.profiles.findOne({ filters: { user: user.id } });
    if (!profile) throw new ZiteError('Please complete your profile before ordering.');
    const plan = await zite.subscriptionPlans.findOne({ id: input.planId });
    const { planId: _p, ...rest } = input;
    const created = await zite.subscriptions.create({
      record: { ...rest, planName: plan?.name ?? 'Unknown', amount: plan?.price ?? 0, status: 'Pending', deliveryStatus: 'Awaiting Payment Check', subscriber: user.id },
    });
    return { id: created.id };
  },
});

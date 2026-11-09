import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Loads one magazine issue for the flipbook reader',
  inputSchema: z.object({ id: z.string() }),
  outputSchema: z.object({ id: z.string(), title: z.string(), description: z.string(), pdfUrl: z.string(), issueDate: z.string() }),
  execute: async ({ input }) => {
    const i = await zite.issues.findOne({ id: input.id });
    if (!i || !i.visible) throw new ZiteError('This issue is not available.');
    return { id: i.id, title: i.title ?? '', description: i.description ?? '', pdfUrl: i.pdfUrl ?? '', issueDate: i.issueDate ?? '' };
  },
});

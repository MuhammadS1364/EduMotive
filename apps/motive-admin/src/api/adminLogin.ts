import { z } from 'zod';
import { createEndpoint, ZiteError } from 'zitejs/backend';
import { checkCredentials, ADMIN_TOKEN } from '../lib/adminAuth';

export default createEndpoint({
  description: 'Signs the admin in with username and password',
  inputSchema: z.object({ username: z.string(), password: z.string() }),
  outputSchema: z.object({ token: z.string() }),
  execute: async ({ input }) => {
    if (!checkCredentials(input.username, input.password)) {
      throw new ZiteError('Incorrect username or password.');
    }
    return { token: ADMIN_TOKEN };
  },
});

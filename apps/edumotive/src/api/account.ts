import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { auth, friendly } from '../lib/auth.server';

const User = z.object({ id: z.string(), email: z.string(), name: z.string(), firstName: z.string(), lastName: z.string(), image: z.string().nullable() });

const Out = z.object({ token: z.string().optional(), user: User.nullable().optional(), needsCode: z.boolean().optional(), googleClientId: z.string().optional() });

export default createEndpoint({
  description: 'Handles sign up, sign in, email codes, password reset and Google sign-in (accounts stored in Turso)',
  inputSchema: z.object({
    action: z.enum(['config', 'me', 'signup', 'verify', 'login', 'forgot', 'reset', 'google', 'logout']),
    email: z.string().optional(), password: z.string().optional(), name: z.string().optional(),
    code: z.string().optional(), credential: z.string().optional(), session: z.string().optional(),
  }),
  outputSchema: Out,
  execute: async ({ input: i }) => friendly(async (): Promise<z.infer<typeof Out>> => {
    const e = i.email ?? '', p = i.password ?? '';
    switch (i.action) {
      case 'config': return { googleClientId: (process.env as Record<string, string | undefined>).ZITE_GOOGLE_CLIENT_ID ?? '' };
      case 'me': return { user: await auth.getUser(i.session) };
      case 'signup': return auth.signup(e, p, i.name ?? '');
      case 'verify': return auth.verify(e, i.code ?? '');
      case 'login': return auth.login(e, p);
      case 'forgot': await auth.forgot(e); return {};
      case 'reset': return auth.reset(e, i.code ?? '', p);
      case 'google': {
        const id = (process.env as Record<string, string | undefined>).ZITE_GOOGLE_CLIENT_ID;
        if (!id) throw new Error('Google sign-in is not set up yet.');
        return auth.google(i.credential ?? '', id);
      }
      case 'logout': if (i.session) await auth.logout(i.session); return {};
    }
  }),
});

import { ZiteError } from 'zitejs/backend';
import { Email } from 'zitejs/email';
import { createAuth, AuthError } from '@project/tursodb/auth';
import { zite } from './db';

export const auth = createAuth(zite.raw, (to, subject, text) => Email.send({ to, subject, body: [{ type: 'text', content: text }] }), 'UniMedia');

/** Turns auth problems into friendly messages for the visitor. */
export async function friendly<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) {
    if (e instanceof AuthError) throw new ZiteError({ code: 'BAD_REQUEST', message: e.message, userFacingMessage: e.message });
    throw e;
  }
}

/** Signed-in user for an endpoint, or a "please sign in" error. */
export const requireUser = (session?: string) => friendly(() => auth.requireUser(session));
export const optionalUser = (session?: string) => auth.getUser(session).catch(() => null);

import { createZite } from '@project/tursodb';

/** All app data lives in Turso. Credentials come from the app's Secrets. */
export const zite = createZite(() => ({ url: process.env.ZITE_TURSO_URL, token: process.env.ZITE_TURSO_AUTH_TOKEN }));

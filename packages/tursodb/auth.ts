/**
 * Own user accounts stored in Turso: email + password, email verification codes,
 * forgot-password codes, Google sign-in, and session tokens.
 * Apps pass in their Turso client and an email sender.
 */
import type { createTurso } from './index';

type Db = ReturnType<typeof createTurso>;
export type SendMail = (to: string, subject: string, text: string) => Promise<unknown>;
export type AuthUser = { id: string; email: string; name: string; firstName: string; lastName: string; image: string | null };
export class AuthError extends Error {}

export const AUTH_TABLES = [
  `CREATE TABLE IF NOT EXISTS "AuthUsers" ("id" TEXT PRIMARY KEY, "email" TEXT UNIQUE NOT NULL, "name" TEXT, "firstName" TEXT, "lastName" TEXT, "image" TEXT, "passwordHash" TEXT, "googleId" TEXT, "verified" INTEGER DEFAULT 0, "created" TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS "AuthCodes" ("email" TEXT NOT NULL, "purpose" TEXT NOT NULL, "codeHash" TEXT NOT NULL, "expires" INTEGER NOT NULL, "attempts" INTEGER DEFAULT 0, "sentAt" INTEGER NOT NULL, PRIMARY KEY ("email", "purpose"))`,
  `CREATE TABLE IF NOT EXISTS "AuthSessions" ("tokenHash" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "expires" INTEGER NOT NULL)`,
];

const enc = new TextEncoder();
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha = async (s: string) => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const rand = (n: number) => hex(crypto.getRandomValues(new Uint8Array(n)).buffer);
const norm = (e: string) => e.trim().toLowerCase();
const DAY = 86_400_000;

async function pbkdf2(pw: string, salt: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 100_000 }, key, 256));
}
async function hashPassword(pw: string) { const salt = rand(16); return `${salt}:${await pbkdf2(pw, salt)}`; }
async function checkPassword(pw: string, stored: string | null) {
  if (!stored) return false;
  const [salt, h] = stored.split(':');
  const got = await pbkdf2(pw, salt);
  let diff = got.length ^ h.length;
  for (let i = 0; i < Math.min(got.length, h.length); i++) diff |= got.charCodeAt(i) ^ h.charCodeAt(i);
  return diff === 0;
}
function checkStrength(pw: string) { if (pw.length < 8) throw new AuthError('Password must be at least 8 characters.'); }

export function createAuth(db: Db, sendMail: SendMail, site = 'EduMotive') {
  const toUser = (r: Record<string, unknown>): AuthUser => ({
    id: String(r.id), email: String(r.email), name: String(r.name ?? ''), firstName: String(r.firstName ?? ''), lastName: String(r.lastName ?? ''), image: (r.image as string) ?? null,
  });
  const byEmail = async (email: string) => (await db.execute('SELECT * FROM "AuthUsers" WHERE "email" = ?', [norm(email)]))[0];

  async function newSession(userId: string) {
    const token = rand(32);
    await db.execute('INSERT INTO "AuthSessions" ("tokenHash","userId","expires") VALUES (?,?,?)', [await sha(token), userId, Date.now() + 30 * DAY]);
    return token;
  }
  async function sendCode(email: string, purpose: 'verify' | 'reset') {
    const prev = (await db.execute('SELECT "sentAt" FROM "AuthCodes" WHERE "email"=? AND "purpose"=?', [email, purpose]))[0];
    if (prev && Date.now() - Number(prev.sentAt) < 45_000) throw new AuthError('Please wait a moment before requesting another code.');
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
    await db.execute('INSERT OR REPLACE INTO "AuthCodes" ("email","purpose","codeHash","expires","attempts","sentAt") VALUES (?,?,?,?,0,?)',
      [email, purpose, await sha(code + email), Date.now() + 10 * 60_000, Date.now()]);
    const what = purpose === 'verify' ? 'verify your email' : 'reset your password';
    await sendMail(email, `${code} is your ${site} code`, `Use this code to ${what}:\n\n${code}\n\nIt expires in 10 minutes. If you didn't request this, you can ignore this email.`);
  }
  async function useCode(email: string, purpose: 'verify' | 'reset', code: string) {
    const row = (await db.execute('SELECT * FROM "AuthCodes" WHERE "email"=? AND "purpose"=?', [email, purpose]))[0];
    if (!row || Number(row.expires) < Date.now()) throw new AuthError('This code has expired. Please request a new one.');
    if (Number(row.attempts) >= 5) throw new AuthError('Too many wrong attempts. Please request a new code.');
    if (row.codeHash !== await sha(code.trim() + email)) {
      await db.execute('UPDATE "AuthCodes" SET "attempts" = "attempts" + 1 WHERE "email"=? AND "purpose"=?', [email, purpose]);
      throw new AuthError('That code is not correct.');
    }
    await db.execute('DELETE FROM "AuthCodes" WHERE "email"=? AND "purpose"=?', [email, purpose]);
  }

  return {
    async getUser(token?: string | null): Promise<AuthUser | null> {
      if (!token) return null;
      const r = (await db.execute('SELECT u.* FROM "AuthSessions" s JOIN "AuthUsers" u ON u.id = s.userId WHERE s.tokenHash = ? AND s.expires > ?', [await sha(token), Date.now()]))[0];
      return r ? toUser(r) : null;
    },
    async requireUser(token?: string | null) {
      const u = await this.getUser(token);
      if (!u) throw new AuthError('Please sign in again.');
      return u;
    },
    async signup(emailIn: string, password: string, name: string) {
      const email = norm(emailIn);
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthError('Enter a valid email address.');
      checkStrength(password);
      const existing = await byEmail(email);
      if (existing?.verified && existing.passwordHash) throw new AuthError('An account with this email already exists. Sign in instead.');
      const [firstName, ...rest] = name.trim().split(/\s+/);
      const hash = await hashPassword(password);
      if (existing) await db.execute('UPDATE "AuthUsers" SET "passwordHash"=?, "name"=COALESCE(NULLIF("name",\'\'),?), "firstName"=COALESCE(NULLIF("firstName",\'\'),?), "lastName"=COALESCE(NULLIF("lastName",\'\'),?) WHERE "id"=?', [hash, name.trim(), firstName ?? '', rest.join(' '), String(existing.id)]);
      else await db.execute('INSERT INTO "AuthUsers" ("id","email","name","firstName","lastName","passwordHash","verified","created") VALUES (?,?,?,?,?,?,0,?)', [crypto.randomUUID(), email, name.trim(), firstName ?? '', rest.join(' '), hash, new Date().toISOString()]);
      await sendCode(email, 'verify');
      return { needsCode: true as const };
    },
    async verify(emailIn: string, code: string) {
      const email = norm(emailIn);
      await useCode(email, 'verify', code);
      const u = await byEmail(email);
      if (!u) throw new AuthError('Account not found.');
      await db.execute('UPDATE "AuthUsers" SET "verified"=1 WHERE "id"=?', [String(u.id)]);
      return { token: await newSession(String(u.id)), user: toUser(u) };
    },
    async login(emailIn: string, password: string) {
      const email = norm(emailIn);
      const u = await byEmail(email);
      if (!u || !(await checkPassword(password, (u.passwordHash as string) ?? null))) {
        if (u && !u.passwordHash) throw new AuthError('This account has no password yet. Use "Forgot password" to set one, or sign in with Google.');
        throw new AuthError('Wrong email or password.');
      }
      if (!u.verified) { await sendCode(email, 'verify').catch(() => {}); return { needsCode: true as const }; }
      return { token: await newSession(String(u.id)), user: toUser(u) };
    },
    async forgot(emailIn: string) {
      const email = norm(emailIn);
      if (await byEmail(email)) await sendCode(email, 'reset');
      return { ok: true };
    },
    async reset(emailIn: string, code: string, password: string) {
      const email = norm(emailIn);
      checkStrength(password);
      await useCode(email, 'reset', code);
      const u = await byEmail(email);
      if (!u) throw new AuthError('Account not found.');
      await db.batch([
        { sql: 'UPDATE "AuthUsers" SET "passwordHash"=?, "verified"=1 WHERE "id"=?', args: [await hashPassword(password), String(u.id)] },
        { sql: 'DELETE FROM "AuthSessions" WHERE "userId"=?', args: [String(u.id)] },
      ]);
      return { token: await newSession(String(u.id)), user: toUser(u) };
    },
    async google(credential: string, clientId: string) {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
      const p = await res.json() as Record<string, string>;
      if (!res.ok || p.aud !== clientId || p.email_verified !== 'true') throw new AuthError('Google sign-in failed. Please try again.');
      const email = norm(p.email);
      let u = await byEmail(email);
      if (u) await db.execute('UPDATE "AuthUsers" SET "googleId"=?, "verified"=1, "image"=COALESCE("image",?) WHERE "id"=?', [p.sub, p.picture ?? null, String(u.id)]);
      else await db.execute('INSERT INTO "AuthUsers" ("id","email","name","firstName","lastName","image","googleId","verified","created") VALUES (?,?,?,?,?,?,?,1,?)',
        [crypto.randomUUID(), email, p.name ?? '', p.given_name ?? '', p.family_name ?? '', p.picture ?? null, p.sub, new Date().toISOString()]);
      u = await byEmail(email);
      return { token: await newSession(String(u!.id)), user: toUser(u!) };
    },
    async logout(token: string) { await db.execute('DELETE FROM "AuthSessions" WHERE "tokenHash"=?', [await sha(token)]); },
    async updateName(token: string, name: string) {
      const u = await this.requireUser(token);
      const [firstName, ...rest] = name.trim().split(/\s+/);
      await db.execute('UPDATE "AuthUsers" SET "name"=?, "firstName"=?, "lastName"=? WHERE "id"=?', [name.trim(), firstName ?? '', rest.join(' '), u.id]);
    },
  };
}

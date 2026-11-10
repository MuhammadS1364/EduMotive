import type {
  ProfilesRecordType, ProfilesRecordInput, ArticlesRecordType, ArticlesRecordInput, IssuesRecordType, IssuesRecordInput,
  TeamMembersRecordType, TeamMembersRecordInput, SiteSettingsRecordType, SiteSettingsRecordInput, ProgramsRecordType, ProgramsRecordInput,
  ResultsRecordType, ResultsRecordInput, CommentsRecordType, CommentsRecordInput, PostsRecordType, PostsRecordInput,
  SubscriptionsRecordType, SubscriptionsRecordInput, NotesRecordType, NotesRecordInput, ContentPlansRecordType, ContentPlansRecordInput,
  SectionsRecordType, SectionsRecordInput, BadgesRecordType, BadgesRecordInput, StoriesRecordType, StoriesRecordInput,
  SubscriptionPlansRecordType, SubscriptionPlansRecordInput,
} from 'zitejs/db';
import { SCHEMA, createTableSql } from './schema';

export { SCHEMA, createTableSql };

type Val = string | number | boolean | null;
type Cell = { type: string; value?: string | number };
export type TursoConfig = { url: string; token: string };

/** Minimal libSQL-over-HTTP client (works in Workers, no dependencies). */
export function createTurso(getConfig: () => TursoConfig) {
  const toArg = (v: Val): Cell =>
    v === null || v === undefined ? { type: 'null' }
    : typeof v === 'boolean' ? { type: 'integer', value: v ? '1' : '0' }
    : typeof v === 'number' ? (Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'float', value: v })
    : { type: 'text', value: String(v) };
  const fromCell = (c: Cell) => (c.type === 'null' ? null : c.type === 'integer' ? Number(c.value) : c.value ?? null);

  async function batch(stmts: { sql: string; args?: Val[] }[]) {
    const { url, token } = getConfig();
    const base = url.replace(/^libsql:\/\//, 'https://').replace(/\/$/, '');
    const res = await fetch(`${base}/v2/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [...stmts.map((s) => ({ type: 'execute', stmt: { sql: s.sql, args: (s.args ?? []).map(toArg) } })), { type: 'close' }] }),
    });
    if (!res.ok) throw new Error(`Turso error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const json = await res.json();
    return stmts.map((_, i) => {
      const r = json.results[i];
      if (r.type === 'error') throw new Error(`Turso: ${r.error?.message}`);
      const result = r.response.result;
      const cols: string[] = result.cols.map((c: { name: string }) => c.name);
      return result.rows.map((row: Cell[]) => Object.fromEntries(row.map((c, j) => [cols[j], fromCell(c)]))) as Record<string, unknown>[];
    });
  }
  return { batch, execute: async (sql: string, args: Val[] = []) => (await batch([{ sql, args }]))[0] };
}

type Turso = ReturnType<typeof createTurso>;
type Filters = Record<string, unknown>;
type FindAllParams = { filters?: Filters; sort?: { field: string; direction?: 'asc' | 'desc' }[]; limit?: number; offset?: number; fields?: string[] };

function tableClient<T extends { id: string }, I>(db: Turso, table: string) {
  const def = SCHEMA[table];
  const inverse = def.inverse ?? {};
  const now = () => new Date().toISOString();
  const q = (s: string) => `"${s}"`;

  const toList = (v: unknown): string[] => [v].flat().filter((x): x is string => typeof x === 'string' && !!x);
  const encode = (field: string, v: unknown): Val => {
    const t = def.fields[field];
    if (v === null || v === undefined || v === '') return t === 't' && v === '' ? '' : null;
    if (t === 'a') { const l = toList(v); return l.length ? JSON.stringify(l) : null; }
    if (t === 'b') return v === true || v === 'true' || v === 1 ? 1 : 0;
    if (t === 'n') { const n = Number(v); return isNaN(n) ? null : n; }
    return v instanceof Date ? v.toISOString() : String(v);
  };
  const decode = (row: Record<string, unknown>) => {
    const out: Record<string, unknown> = { id: row.id, created: row.created, updated: row.updated };
    for (const [f, t] of Object.entries(def.fields)) {
      const v = row[f];
      if (v === null || v === undefined) continue;
      out[f] = t === 'a' ? JSON.parse(String(v)) : t === 'b' ? !!v : t === 'n' ? Number(v) : v;
    }
    for (const f of Object.keys(inverse)) out[f] = row[f] ? JSON.parse(String(row[f])) : [];
    return out as T;
  };
  const selectSql = () => {
    const inv = Object.entries(inverse).map(([f, { table: ot, field: of }]) =>
      `(SELECT json_group_array(o."id") FROM ${q(ot)} o WHERE EXISTS (SELECT 1 FROM json_each(o.${q(of)}) WHERE value = t."id")) AS ${q(f)}`);
    return `SELECT t.*${inv.length ? ', ' + inv.join(', ') : ''} FROM ${q(table)} t`;
  };
  const colExpr = (f: string) => (f === 'id' || f === 'created' || f === 'updated' ? `t.${q(f)}` : def.fields[f] ? `t.${q(f)}` : null);

  function where(filters: Filters = {}) {
    const parts: string[] = []; const args: Val[] = [];
    for (const [f, raw] of Object.entries(filters)) {
      if (raw === undefined) throw new Error(`Filter "${f}" is undefined`);
      const col = colExpr(f); if (!col) throw new Error(`Unknown field "${f}" on ${table}`);
      const isArr = def.fields[f] === 'a', isBool = def.fields[f] === 'b';
      const ops = raw !== null && typeof raw === 'object' && !Array.isArray(raw) && !(raw instanceof Date) ? (raw as Record<string, unknown>) : { eq: raw };
      for (const [op, v] of Object.entries(ops)) {
        const val = v instanceof Date ? v.toISOString() : (v as Val);
        if (op === 'eq') {
          if (val === null) parts.push(`${col} IS NULL`);
          else if (isArr) { parts.push(`EXISTS (SELECT 1 FROM json_each(${col}) WHERE value = ?)`); args.push(val); }
          else if (isBool) parts.push(val ? `${col} = 1` : `(${col} = 0 OR ${col} IS NULL)`);
          else { parts.push(`${col} = ?`); args.push(val); }
        } else if (op === 'not') {
          if (val === null) parts.push(`${col} IS NOT NULL`);
          else if (isArr) { parts.push(`NOT EXISTS (SELECT 1 FROM json_each(COALESCE(${col}, '[]')) WHERE value = ?)`); args.push(val); }
          else { parts.push(`(${col} IS NULL OR ${col} != ?)`); args.push(isBool ? (val ? 1 : 0) : val); }
        } else if (op === 'contains') { parts.push(`${col} LIKE ?`); args.push(`%${val}%`); }
        else if (op === 'in' || op === 'notIn') {
          const list = v as Val[];
          if (!list.length) { if (op === 'in') parts.push('0'); continue; }
          const ph = list.map(() => '?').join(',');
          parts.push(isArr ? `${op === 'notIn' ? 'NOT ' : ''}EXISTS (SELECT 1 FROM json_each(COALESCE(${col}, '[]')) WHERE value IN (${ph}))` : `${col} ${op === 'in' ? 'IN' : 'NOT IN'} (${ph})`);
          args.push(...list);
        } else {
          const sym = { lt: '<', lte: '<=', gt: '>', gte: '>=' }[op];
          if (!sym) throw new Error(`Unknown operator ${op}`);
          parts.push(`${col} ${sym} ?`); args.push(val);
        }
      }
    }
    return { sql: parts.length ? ` WHERE ${parts.join(' AND ')}` : '', args };
  }

  async function findAll(params: FindAllParams = {}) {
    const limit = Math.min(params.limit ?? 500, 2000);
    const w = where(params.filters);
    const order = (params.sort ?? []).map((s) => `${colExpr(s.field) ?? 't."created"'} ${s.direction === 'desc' ? 'DESC' : 'ASC'}`);
    const rows = await db.execute(`${selectSql()}${w.sql} ORDER BY ${order.length ? order.join(', ') + ', ' : ''}t."created" ASC LIMIT ? OFFSET ?`, [...w.args, limit + 1, params.offset ?? 0]);
    return { records: rows.slice(0, limit).map(decode), hasMore: rows.length > limit };
  }

  async function findOne(params: { id?: string; filters?: Filters; fields?: string[] }) {
    const filters = { ...(params.filters ?? {}), ...(params.id ? { id: params.id } : {}) };
    return (await findAll({ filters, limit: 1 })).records[0] as T | undefined;
  }

  /** Writes to computed inverse link fields by updating the owning side. */
  async function writeInverse(id: string, record: Record<string, unknown>) {
    for (const [f, { table: ot, field: of }] of Object.entries(inverse)) {
      if (!(f in record)) continue;
      const want = new Set(toList(record[f]));
      const rows = await db.execute(`SELECT "id", ${q(of)} AS v FROM ${q(ot)}`);
      const stmts: { sql: string; args: Val[] }[] = [];
      for (const r of rows) {
        const cur: string[] = r.v ? JSON.parse(String(r.v)) : [];
        const has = cur.includes(id), should = want.has(String(r.id));
        if (has === should) continue;
        const next = should ? [...cur, id] : cur.filter((x) => x !== id);
        stmts.push({ sql: `UPDATE ${q(ot)} SET ${q(of)} = ?, "updated" = ? WHERE "id" = ?`, args: [next.length ? JSON.stringify(next) : null, now(), String(r.id)] });
      }
      if (stmts.length) await db.batch(stmts);
    }
  }

  const ownFields = (record: Record<string, unknown>) => Object.keys(record).filter((k) => def.fields[k]);

  async function create(params: { record: Partial<I> & Record<string, unknown> }) {
    const record = params.record as Record<string, unknown>;
    const id = crypto.randomUUID(); const ts = now();
    const keys = ownFields(record);
    await db.execute(`INSERT INTO ${q(table)} ("id", ${keys.map(q).map((k) => k + ', ').join('')}"created", "updated") VALUES (?, ${keys.map(() => '?, ').join('')}?, ?)`,
      [id, ...keys.map((k) => encode(k, record[k])), ts, ts]);
    await writeInverse(id, record);
    return (await findOne({ id })) as T;
  }

  async function update(params: { id: string; record: Partial<I> & Record<string, unknown> }) {
    const record = params.record as Record<string, unknown>;
    const keys = ownFields(record);
    await db.execute(`UPDATE ${q(table)} SET ${keys.map((k) => `${q(k)} = ?, `).join('')}"updated" = ? WHERE "id" = ?`, [...keys.map((k) => encode(k, record[k])), now(), params.id]);
    await writeInverse(params.id, record);
    return { id: params.id, fields: record as Partial<T> };
  }

  async function del(params: { id: string }) {
    await db.execute(`DELETE FROM ${q(table)} WHERE "id" = ?`, [params.id]);
    return { success: true as const, id: params.id };
  }

  async function bulkCreate(params: { records: (Partial<I> & Record<string, unknown>)[]; matchOn?: string[] }) {
    const out: T[] = [];
    for (const record of params.records) {
      const r = record as Record<string, unknown>;
      const existing = params.matchOn?.length ? await findOne({ filters: Object.fromEntries(params.matchOn.map((k) => [k, r[k] ?? null])) }) : undefined;
      if (existing) { await update({ id: existing.id, record }); out.push((await findOne({ id: existing.id })) as T); }
      else out.push(await create({ record }));
    }
    return { success: true, records: out };
  }

  return { findAll, findOne, create, update, delete: del, bulkCreate };
}

export function createZite(getConfig: () => TursoConfig) {
  const db = createTurso(getConfig);
  return {
    profiles: tableClient<ProfilesRecordType, ProfilesRecordInput>(db, 'Profiles'),
    articles: tableClient<ArticlesRecordType, ArticlesRecordInput>(db, 'Articles'),
    issues: tableClient<IssuesRecordType, IssuesRecordInput>(db, 'Issues'),
    teamMembers: tableClient<TeamMembersRecordType, TeamMembersRecordInput>(db, 'TeamMembers'),
    siteSettings: tableClient<SiteSettingsRecordType, SiteSettingsRecordInput>(db, 'SiteSettings'),
    programs: tableClient<ProgramsRecordType, ProgramsRecordInput>(db, 'Programs'),
    results: tableClient<ResultsRecordType, ResultsRecordInput>(db, 'Results'),
    comments: tableClient<CommentsRecordType, CommentsRecordInput>(db, 'Comments'),
    posts: tableClient<PostsRecordType, PostsRecordInput>(db, 'Posts'),
    subscriptions: tableClient<SubscriptionsRecordType, SubscriptionsRecordInput>(db, 'Subscriptions'),
    notes: tableClient<NotesRecordType, NotesRecordInput>(db, 'Notes'),
    contentPlans: tableClient<ContentPlansRecordType, ContentPlansRecordInput>(db, 'ContentPlans'),
    sections: tableClient<SectionsRecordType, SectionsRecordInput>(db, 'Sections'),
    badges: tableClient<BadgesRecordType, BadgesRecordInput>(db, 'Badges'),
    stories: tableClient<StoriesRecordType, StoriesRecordInput>(db, 'Stories'),
    subscriptionPlans: tableClient<SubscriptionPlansRecordType, SubscriptionPlansRecordInput>(db, 'SubscriptionPlans'),
    heroSlides: tableClient<HeroSlidesRecordType, HeroSlidesRecordInput>(db, 'HeroSlides'),
    /** Raw read query (SQLite dialect). */
    sql: async ({ query, params }: { query: string; params?: Val[] }) => {
      const rows = await db.execute(query, params ?? []);
      return { rows, rowCount: rows.length };
    },
    raw: db,
  };
}

export type HeroSlidesRecordType = { id: string; image?: string; link?: string; sortOrder?: number; visible?: boolean; created?: string };
export type HeroSlidesRecordInput = { image: string | null; link: string | null; sortOrder: string | number | null; visible: string | boolean | null };

import { zite } from './db';

const THRESHOLDS: Record<string, number> = { 'First Publication': 1, '5 Publications': 5, '10 Publications': 10 };
const arr = (v: string | string[] | undefined) => [v].flat().filter((x): x is string => !!x);

/** Gives an author every automatic badge they have earned from their published count. */
export async function syncAuthorBadges(articleId: string) {
  const article = await zite.articles.findOne({ id: articleId });
  const userId = arr(article?.author)[0];
  if (!userId) return;
  const [published, badges, profile] = await Promise.all([
    zite.articles.findAll({ filters: { author: userId, status: 'Published' }, limit: 2000, fields: ['title'] }),
    zite.badges.findAll({ limit: 200 }),
    zite.profiles.findOne({ filters: { user: userId } }),
  ]);
  if (!profile) return;
  const count = published.records.length;
  const earned = badges.records.filter((b) => THRESHOLDS[b.rule ?? ''] && count >= THRESHOLDS[b.rule ?? '']).map((b) => b.id);
  const current = arr(profile.badges);
  const next = Array.from(new Set([...current, ...earned]));
  if (next.length !== current.length) await zite.profiles.update({ id: profile.id, record: { badges: next } });
}

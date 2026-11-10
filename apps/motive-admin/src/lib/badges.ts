import { zite } from 'zitejs/db';

const THRESHOLDS: Record<string, number> = { 'First Publication': 1, '5 Publications': 5, '10 Publications': 10 };
const arr = (v: string | string[] | undefined) => [v].flat().filter((x): x is string => !!x);

/** Gives an author every automatic badge they have earned from their published count. */
export async function syncAuthorBadges(articleId: string) {
  const article = await zite.articles.findOne({ id: articleId });
  if (!article) return;
  const userId = arr(article.author)[0];
  const profileId = arr(article.authorProfile)[0];

  let profile = userId ? await zite.profiles.findOne({ filters: { user: userId } }) : null;
  if (!profile && profileId) {
    profile = await zite.profiles.findOne({ id: profileId });
  }
  if (!profile) return;

  const [publishedByUser, publishedByProfile, badges] = await Promise.all([
    userId ? zite.articles.findAll({ filters: { author: userId, status: 'Published' }, limit: 2000, fields: ['title'] }) : Promise.resolve({ records: [] }),
    profile.id ? zite.articles.findAll({ filters: { authorProfile: profile.id, status: 'Published' }, limit: 2000, fields: ['title'] }) : Promise.resolve({ records: [] }),
    zite.badges.findAll({ limit: 200 }),
  ]);

  const uniqueArticles = new Set([...publishedByUser.records.map((r) => r.id), ...publishedByProfile.records.map((r) => r.id)]);
  const count = uniqueArticles.size;
  const earned = badges.records.filter((b) => THRESHOLDS[b.rule ?? ''] && count >= THRESHOLDS[b.rule ?? '']).map((b) => b.id);
  const current = arr(profile.badges);
  const next = Array.from(new Set([...current, ...earned]));
  if (next.length !== current.length) await zite.profiles.update({ id: profile.id, record: { badges: next } });
}

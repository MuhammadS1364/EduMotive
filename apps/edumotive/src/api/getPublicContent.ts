import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

const arr = (v: string | string[] | undefined) => [v].flat().filter((x): x is string => !!x);
const badge = z.object({ name: z.string(), emoji: z.string(), icon: z.string(), description: z.string() });

export default createEndpoint({
  description: 'Loads published articles, issues, programs, results, team, authors, plans and site settings for the public site',
  inputSchema: z.object({}),
  outputSchema: z.object({
    articles: z.array(z.object({ id: z.string(), title: z.string(), excerpt: z.string(), coverImage: z.string(), section: z.string(), authorName: z.string(), authorId: z.string(), issueId: z.string(), featured: z.boolean(), publishedAt: z.string() })),
    issues: z.array(z.object({ id: z.string(), title: z.string(), description: z.string(), coverImage: z.string(), issueDate: z.string() })),
    programs: z.array(z.object({ id: z.string(), title: z.string(), image: z.string(), fee: z.number(), description: z.string(), eligibility: z.string(), mode: z.string(), registrationLink: z.string(), eventDate: z.string() })),
    results: z.array(z.object({ id: z.string(), participant: z.string(), programName: z.string(), position: z.string(), institution: z.string() })),
    team: z.array(z.object({ id: z.string(), name: z.string(), designation: z.string(), photo: z.string(), phone: z.string(), address: z.string(), email: z.string(), instagram: z.string(), linkedin: z.string(), twitter: z.string(), facebook: z.string(), bio: z.string(), sortOrder: z.number() })),
    sections: z.array(z.object({ id: z.string(), name: z.string(), description: z.string() })),
    plans: z.array(z.object({ id: z.string(), name: z.string(), price: z.number(), duration: z.string(), features: z.array(z.string()) })),
    authors: z.array(z.object({ id: z.string(), name: z.string(), avatar: z.string(), institution: z.string(), class: z.string(), bio: z.string(), role: z.string(), designation: z.string(), count: z.number(), badges: z.array(badge) })),
    settings: z.record(z.string()),
  }),
  execute: async () => {
    const [a, i, p, r, t, s, sec, pl, pr, bd] = await Promise.all([
      zite.articles.findAll({ filters: { status: 'Published' }, limit: 2000, fields: ['title', 'excerpt', 'coverImage', 'section', 'authorName', 'author', 'authorProfile', 'issue', 'featured', 'publishedAt', 'created'] }),
      zite.issues.findAll({ filters: { visible: true }, limit: 500 }),
      zite.programs.findAll({ filters: { visible: true }, limit: 500 }),
      zite.results.findAll({ filters: { visible: true }, limit: 2000 }),
      zite.teamMembers.findAll({ limit: 200 }),
      zite.siteSettings.findAll({ limit: 200 }),
      zite.sections.findAll({ filters: { visible: true }, limit: 100 }),
      zite.subscriptionPlans.findAll({ filters: { visible: true }, limit: 50 }),
      zite.profiles.findAll({ limit: 2000 }),
      zite.badges.findAll({ limit: 200 }),
    ]);
    const settings: Record<string, string> = {};
    s.records.forEach((x) => { if (x.key) settings[x.key] = x.value ?? ''; });
    const keyOf = new Map(pr.records.map((x) => [x.id, arr(x.user)[0] || x.id]));
    const articles = a.records
      .map((x) => ({ id: x.id, title: x.title ?? '', excerpt: x.excerpt ?? '', coverImage: x.coverImage ?? '', section: x.section ?? '', authorName: x.authorName ?? '', authorId: keyOf.get(arr(x.authorProfile)[0] ?? '') || arr(x.author)[0] || '', issueId: arr(x.issue)[0] ?? '', featured: !!x.featured, publishedAt: x.publishedAt ?? x.created ?? '' }))
      .sort((x, y) => y.publishedAt.localeCompare(x.publishedAt));
    const counts = new Map<string, number>();
    articles.forEach((x) => x.authorId && counts.set(x.authorId, (counts.get(x.authorId) ?? 0) + 1));
    const badgeMap = new Map(bd.records.map((b) => [b.id, { name: b.name ?? '', emoji: b.emoji ?? '🏅', icon: b.icon ?? '', description: b.description ?? '' }]));
    const authors = pr.records
      .map((x) => {
        const uid = arr(x.user)[0] || x.id;
        return { id: uid, name: x.name ?? '', avatar: x.avatar ?? '', institution: x.institution ?? '', class: x.class ?? '', bio: x.bio ?? '', role: x.role ?? 'Student', designation: x.designation ?? '', count: counts.get(uid) ?? 0, badges: arr(x.badges).map((b) => badgeMap.get(b)).filter((b): b is z.infer<typeof badge> => !!b) };
      })
      .filter((x) => x.id && (x.role === 'Author' || x.count > 0))
      .sort((x, y) => y.count - x.count);
    return {
      articles,
      issues: i.records.map((x) => ({ id: x.id, title: x.title ?? '', description: x.description ?? '', coverImage: x.coverImage ?? '', issueDate: x.issueDate ?? '' })).sort((x, y) => y.issueDate.localeCompare(x.issueDate)),
      programs: p.records.map((x) => ({ id: x.id, title: x.title ?? '', image: x.image ?? '', fee: x.fee ?? 0, description: x.description ?? '', eligibility: x.eligibility ?? '', mode: x.mode ?? '', registrationLink: x.registrationLink ?? '', eventDate: x.eventDate ?? '' })),
      results: r.records.map((x) => ({ id: x.id, participant: x.participant ?? '', programName: x.programName ?? '', position: x.position ?? '', institution: x.institution ?? '' })),
      team: t.records.map((x) => ({ id: x.id, name: x.name ?? '', designation: x.designation ?? '', photo: x.photo ?? '', phone: x.phone ?? '', address: x.address ?? '', email: x.email ?? '', instagram: x.instagram ?? '', linkedin: x.linkedin ?? '', twitter: x.twitter ?? '', facebook: x.facebook ?? '', bio: x.bio ?? '', sortOrder: x.sortOrder ?? 0 })).sort((x, y) => x.sortOrder - y.sortOrder),
      sections: sec.records.sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)).map((x) => ({ id: x.id, name: x.name ?? '', description: x.description ?? '' })),
      plans: pl.records.sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0)).map((x) => ({ id: x.id, name: x.name ?? '', price: x.price ?? 0, duration: x.duration ?? '', features: (x.features ?? '').split('\n').map((f) => f.trim()).filter(Boolean) })),
      authors,
      settings,
    };
  },
});

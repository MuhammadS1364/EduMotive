/**
 * Turso (libSQL) schema — mirrors the original Zite Database tables one-to-one.
 * t = text, n = number, b = boolean (0/1), a = list of ids stored as JSON text.
 * Link fields are stored on one "owner" side; the other side is computed (inverse).
 */
export type FieldType = 't' | 'n' | 'b' | 'a';
export type TableDef = { fields: Record<string, FieldType>; inverse?: Record<string, { table: string; field: string }> };

export const SCHEMA: Record<string, TableDef> = {
  Profiles: {
    fields: { name: 't', user: 'a', role: 't', class: 't', institution: 't', bio: 't', avatar: 't', badges: 'a', designation: 't' },
    inverse: { articles: { table: 'Articles', field: 'authorProfile' } },
  },
  Articles: {
    fields: { title: 't', excerpt: 't', content: 't', coverImage: 't', section: 't', authorName: 't', author: 'a', status: 't', featured: 'b', publishedAt: 't', authorProfile: 'a', issue: 'a' },
  },
  Issues: {
    fields: { title: 't', description: 't', coverImage: 't', pdfUrl: 't', issueDate: 't', visible: 'b' },
    inverse: { articles: { table: 'Articles', field: 'issue' } },
  },
  TeamMembers: {
    fields: { name: 't', designation: 't', photo: 't', phone: 't', address: 't', email: 't', instagram: 't', linkedin: 't', twitter: 't', sortOrder: 'n', bio: 't', facebook: 't' },
  },
  SiteSettings: { fields: { key: 't', value: 't' } },
  Programs: {
    fields: { title: 't', image: 't', fee: 'n', description: 't', eligibility: 't', mode: 't', registrationLink: 't', eventDate: 't', visible: 'b' },
  },
  Results: { fields: { participant: 't', programName: 't', position: 't', institution: 't', visible: 'b' } },
  Comments: { fields: { text: 't', post: 'a', authorName: 't', author: 'a' } },
  Posts: {
    fields: { caption: 't', image: 't', author: 'a', authorName: 't', institution: 't', likedBy: 'a', hidden: 'b', mediaType: 't' },
    inverse: { comments: { table: 'Comments', field: 'post' } },
  },
  Subscriptions: {
    fields: { name: 't', email: 't', phone: 't', address: 't', plan: 't', amount: 'n', transactionId: 't', paymentScreenshot: 't', status: 't', planName: 't', trackingNumber: 't', deliveryStatus: 't', subscriber: 'a' },
  },
  Notes: { fields: { title: 't', content: 't', color: 't', pinned: 'b' } },
  ContentPlans: { fields: { title: 't', description: 't', status: 't', dueDate: 't', assignee: 't' } },
  Sections: { fields: { name: 't', description: 't', visible: 'b', sortOrder: 'n' } },
  Badges: {
    fields: { name: 't', description: 't', emoji: 't', rule: 't', icon: 't' },
    inverse: { profiles: { table: 'Profiles', field: 'badges' } },
  },
  Stories: { fields: { caption: 't', media: 't', mediaType: 't', author: 'a', authorName: 't' } },
  SubscriptionPlans: { fields: { name: 't', price: 'n', duration: 't', features: 't', visible: 'b', sortOrder: 'n' } },
  HeroSlides: { fields: { image: 't', link: 't', sortOrder: 'n', visible: 'b' } },
};

/** CREATE TABLE statements for every table. */
export function createTableSql(): string[] {
  return Object.entries(SCHEMA).map(([name, def]) => {
    const cols = Object.entries(def.fields).map(([f, t]) => `"${f}" ${t === 'n' ? 'REAL' : t === 'b' ? 'INTEGER' : 'TEXT'}`);
    return `CREATE TABLE IF NOT EXISTS "${name}" ("id" TEXT PRIMARY KEY, ${cols.join(', ')}, "created" TEXT NOT NULL, "updated" TEXT NOT NULL)`;
  });
}

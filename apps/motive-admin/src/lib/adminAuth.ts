import { ZiteError } from 'zitejs/backend';

const USERNAME = 'edumotive4';
const PASSWORD = 'edu4motive';
export const ADMIN_TOKEN = 'em4-admin-7f3c9b21-session';

export function checkCredentials(username: string, password: string) {
  return username.trim() === USERNAME && password === PASSWORD;
}

export function requireAdmin(token: string) {
  if (token !== ADMIN_TOKEN) {
    throw new ZiteError('Your admin session has expired. Please sign in again.');
  }
}

export const TABLES = ['articles', 'issues', 'teamMembers', 'programs', 'results', 'subscriptions', 'posts', 'notes', 'contentPlans', 'siteSettings', 'comments', 'profiles', 'sections', 'badges', 'subscriptionPlans'] as const;
export type TableName = (typeof TABLES)[number];

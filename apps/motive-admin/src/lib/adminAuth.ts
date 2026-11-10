import { ZiteError } from 'zitejs/backend';

/** Only this account can use the admin panel. Sign-in is by a one-time code emailed to it. */
import { ADMIN_EMAILS } from './adminEmails';
export { ADMIN_EMAILS };

export function requireAdmin(user: { email: string }) {
  if (!ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    throw new ZiteError('This account does not have admin access.');
  }
}

export const TABLES = ['articles', 'issues', 'teamMembers', 'programs', 'results', 'subscriptions', 'posts', 'notes', 'contentPlans', 'siteSettings', 'comments', 'profiles', 'sections', 'badges', 'subscriptionPlans', 'heroSlides'] as const;
export type TableName = (typeof TABLES)[number];

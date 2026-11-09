import { useQuery } from '@tanstack/react-query';
import { getPublicContent, GetPublicContentOutputType } from 'zitejs/api';

export type Content = GetPublicContentOutputType;
export type ArticleSummary = Content['articles'][0];

export const LOGO_URL =
  'https://images.fillout.com/orgid-886933/flowpublicid-g9mcbthowz/widgetid-default/vJUKs187fWTMbvnC9QkcLg/pasted-image-1791520031939-sk6cjd3r.png';

export function useContent() {
  return useQuery({ queryKey: ['content'], queryFn: () => getPublicContent({}), staleTime: 60_000 });
}

export function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'section';
}

export function extractHeadings(md: string) {
  return md
    .split('\n')
    .map((l) => l.match(/^(#{1,3})\s+(.+?)\s*#*$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .map((m) => {
      const text = m[2].replace(/[*_`[\]]/g, '');
      return { level: m[1].length === 3 ? 3 : 2, text, id: slugify(text) };
    });
}

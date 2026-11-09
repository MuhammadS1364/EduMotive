import { Link, useParams } from 'react-router-dom';
import { Skeleton } from '@project/components/ui/skeleton';
import { useContent, slugify } from '../lib/content';
import ArticleCard from '../components/ArticleCard';

export default function SectionPage() {
  const { slug = '' } = useParams();
  const { data, isLoading } = useContent();
  const section = data?.sections.find((s) => slugify(s.name) === slug);
  const list = (data?.articles ?? []).filter((a) => section && a.section === section.name);
  if (isLoading) return <div className="container mx-auto px-4 py-10"><Skeleton className="h-72" /></div>;
  if (!section) return <div className="text-center py-24">Section not found. <Link to="/" className="text-primary underline">Go home</Link></div>;
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      <div className="text-center space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">Section</p>
        <h1 className="text-4xl md:text-6xl font-extrabold">{section.name}</h1>
        {section.description && <p className="text-muted-foreground max-w-xl mx-auto">{section.description}</p>}
      </div>
      {list.length === 0 ? <p className="text-center text-muted-foreground py-16">No articles in {section.name} yet.</p>
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{list.map((a) => <ArticleCard key={a.id} a={a} />)}</div>}
    </div>
  );
}

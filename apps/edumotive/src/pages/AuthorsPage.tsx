import { Link } from 'react-router-dom';
import { Skeleton } from '@project/components/ui/skeleton';
import { useContent } from '../lib/content';
import AuthorBadges from '../components/AuthorBadges';

export default function AuthorsPage() {
  const { data, isLoading } = useContent();
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      <div className="text-center space-y-2"><h1 className="text-4xl md:text-5xl font-extrabold">Authors</h1><p className="text-muted-foreground">The voices behind Edumotive.</p></div>
      {isLoading ? <Skeleton className="h-64" /> : !data?.authors.length ? <p className="text-center text-muted-foreground py-16">No authors yet.</p> : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.authors.map((a) => (
            <Link key={a.id} to={`/authors/${a.id}`} className="glass p-6 text-center space-y-3 hover:-translate-y-1 transition-transform">
              <div className="h-24 w-24 mx-auto rounded-full overflow-hidden bg-muted ring-4 ring-accent/60 flex items-center justify-center text-3xl font-bold font-serif">
                {a.avatar ? <img src={a.avatar} alt="" className="h-full w-full object-cover" /> : a.name[0]}
              </div>
              <div><p className="text-xl font-bold font-serif">{a.name}</p><p className="text-xs text-muted-foreground">{a.institution}</p></div>
              <AuthorBadges badges={a.badges} className="justify-center" />
              <p className="text-xs font-semibold text-primary">{a.count} article{a.count === 1 ? '' : 's'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

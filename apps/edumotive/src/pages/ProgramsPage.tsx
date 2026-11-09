import { Calendar, ExternalLink, GraduationCap, MapPin, Wallet } from 'lucide-react';
import { Badge } from '@project/components/ui/badge';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { useContent, formatDate } from '../lib/content';

export default function ProgramsPage() {
  const { data, isLoading } = useContent();
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-extrabold">Programs</h1>
        <p className="text-muted-foreground">Workshops, competitions and courses from Edumotive.</p>
      </div>
      {isLoading ? <div className="grid md:grid-cols-2 gap-6">{[1, 2].map((i) => <Skeleton key={i} className="h-96" />)}</div>
        : !data?.programs.length ? <p className="text-center text-muted-foreground py-16">No programs announced yet. Check back soon.</p>
        : (
          <div className="grid md:grid-cols-2 gap-6">
            {data.programs.map((p) => (
              <div key={p.id} className="glass overflow-hidden flex flex-col">
                {p.image && <img src={p.image} alt="" className="aspect-[16/9] w-full object-cover" />}
                <div className="p-6 space-y-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-2xl font-bold">{p.title}</h2>
                    {p.mode && <Badge className="shrink-0"><MapPin className="h-3 w-3 mr-1" />{p.mode}</Badge>}
                  </div>
                  <p className="text-muted-foreground whitespace-pre-line">{p.description}</p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <Info icon={Wallet} label="Fee" value={p.fee ? `₹${p.fee}` : 'Free'} />
                    {p.eventDate && <Info icon={Calendar} label="Date" value={formatDate(p.eventDate)} />}
                  </div>
                  {p.eligibility && (
                    <div className="rounded-lg bg-accent/30 p-3 text-sm">
                      <p className="font-semibold flex items-center gap-1"><GraduationCap className="h-4 w-4" />Eligibility</p>
                      <p className="whitespace-pre-line text-muted-foreground mt-1">{p.eligibility}</p>
                    </div>
                  )}
                  {p.registrationLink && (
                    <Button asChild className="mt-auto rounded-full"><a href={p.registrationLink} target="_blank" rel="noreferrer">Register now <ExternalLink className="h-4 w-4" /></a></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-background/50 p-3">
      <Icon className="h-4 w-4 text-primary" /><span className="text-muted-foreground">{label}:</span><span className="font-semibold">{value}</span>
    </div>
  );
}

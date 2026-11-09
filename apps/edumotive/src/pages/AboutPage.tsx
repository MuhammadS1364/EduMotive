import { useState } from 'react';
import { Eye, Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Target, Twitter } from 'lucide-react';
import { Skeleton } from '@project/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@project/components/ui/dialog';
import { useContent, Content } from '../lib/content';

type Member = Content['team'][0];

export default function AboutPage() {
  const { data, isLoading } = useContent();
  const [sel, setSel] = useState<Member | null>(null);
  if (isLoading || !data) return <div className="container mx-auto px-4 py-10 max-w-5xl space-y-6"><Skeleton className="h-60" /><Skeleton className="h-96" /></div>;
  const s = data.settings;
  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-extrabold">About Us</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto whitespace-pre-line">{s.aboutIntro || 'Edumotive is a student magazine of ideas from Darul Huda Islamic University.'}</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card icon={Eye} title="Our Vision" text={s.vision || 'Our vision will be shared here soon.'} />
        <Card icon={Target} title="Our Mission" text={s.mission || 'Our mission will be shared here soon.'} />
      </div>
      {s.teamPhoto && (
        <figure className="glass p-3">
          <img src={s.teamPhoto} alt="The Edumotive team" className="w-full rounded-xl object-cover" />
          <figcaption className="text-center text-sm text-muted-foreground mt-3">{s.teamPhotoCaption || 'Team Edumotive'}</figcaption>
        </figure>
      )}
      {data.team.length > 0 && (
        <section className="space-y-6">
          <div className="text-center space-y-2"><p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">The people behind it</p><h2 className="text-4xl font-bold">Our team</h2></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {data.team.map((m) => (
              <button key={m.id} onClick={() => setSel(m)} className="group relative aspect-[3/4] overflow-hidden rounded-3xl bg-muted text-left shadow-lg ring-1 ring-white/20 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl">
                {m.photo ? <img src={m.photo} alt={m.name} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  : <span className="absolute inset-0 flex items-center justify-center font-serif text-6xl font-bold text-muted-foreground bg-gradient-to-br from-accent/40 to-primary/30">{m.name[0]}</span>}
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute inset-x-2.5 bottom-2.5 rounded-2xl border border-white/25 bg-white/15 backdrop-blur-xl p-3 text-white">
                  <span className="block font-serif font-bold md:text-lg leading-tight">{m.name}</span>
                  <span className="block text-[11px] md:text-xs font-semibold uppercase tracking-wider text-accent">{m.designation}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      <Dialog open={!!sel} onOpenChange={(o) => !o && setSel(null)}>
        <DialogContent className="max-w-md">
          {sel && (
            <>
              <DialogHeader className="items-center text-center">
                <div className="h-28 w-28 rounded-full overflow-hidden bg-muted ring-4 ring-accent mb-2">{sel.photo && <img src={sel.photo} alt="" className="h-full w-full object-cover" />}</div>
                <DialogTitle className="text-2xl font-serif">{sel.name}</DialogTitle>
                <DialogDescription className="text-primary font-semibold">{sel.designation}</DialogDescription>
              </DialogHeader>
              {sel.bio && <p className="text-sm text-muted-foreground whitespace-pre-line text-center">{sel.bio}</p>}
              <div className="space-y-2 text-sm">
                {sel.phone && <a href={`tel:${sel.phone}`} className="flex gap-2 items-center"><Phone className="h-4 w-4 text-primary" />{sel.phone}</a>}
                {sel.email && <a href={`mailto:${sel.email}`} className="flex gap-2 items-center break-all"><Mail className="h-4 w-4 text-primary" />{sel.email}</a>}
                {sel.address && <p className="flex gap-2"><MapPin className="h-4 w-4 text-primary shrink-0" />{sel.address}</p>}
              </div>
              <div className="flex justify-center gap-2">
                {sel.instagram && <Social href={sel.instagram} icon={Instagram} />}
                {sel.facebook && <Social href={sel.facebook} icon={Facebook} />}
                {sel.twitter && <Social href={sel.twitter} icon={Twitter} />}
                {sel.linkedin && <Social href={sel.linkedin} icon={Linkedin} />}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Card({ icon: Icon, title, text }: { icon: typeof Eye; title: string; text: string }) {
  return (
    <div className="glass p-8 space-y-3">
      <div className="h-12 w-12 rounded-xl bg-accent text-accent-foreground flex items-center justify-center"><Icon className="h-6 w-6" /></div>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{text}</p>
    </div>
  );
}

function Social({ href, icon: Icon }: { href: string; icon: typeof Eye }) {
  return <a href={href} target="_blank" rel="noreferrer" className="h-10 w-10 rounded-full border flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"><Icon className="h-4 w-4" /></a>;
}

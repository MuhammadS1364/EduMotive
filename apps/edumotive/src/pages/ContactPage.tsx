import { Link } from 'react-router-dom';
import { PenSquare, UserPlus } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import { useContent } from '../lib/content';
import { socials } from '../components/Footer';

export default function ContactPage() {
  const { data } = useContent();
  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      <div className="text-center space-y-2"><h1 className="text-4xl md:text-5xl font-extrabold">Join us & Contact</h1><p className="text-muted-foreground">Write for Edumotive, or just say hello.</p></div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass p-8 space-y-4">
          <UserPlus className="h-8 w-8 text-primary" />
          <h2 className="text-2xl font-bold">Join as student or author</h2>
          <p className="text-muted-foreground">Create your profile with your class and institution, then submit essays, poems and reports for the editors to publish.</p>
          <div className="flex gap-2 flex-wrap"><Button asChild className="rounded-full"><Link to="/account">Join now</Link></Button><Button asChild variant="outline" className="rounded-full"><Link to="/write"><PenSquare className="h-4 w-4" />Submit work</Link></Button></div>
        </div>
        <div className="glass p-8 space-y-3">
          <h2 className="text-2xl font-bold">Reach us</h2>
          {socials(data?.settings ?? {}).map(({ href, icon: Icon, label }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border bg-background/50 p-3 hover:border-primary transition-colors">
              <span className="h-9 w-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center"><Icon className="h-4 w-4" /></span>
              <span className="font-medium">{label === 'Instagram' || label === 'Facebook' || label === 'X' ? `${label} · @edumotivetri_16` : label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

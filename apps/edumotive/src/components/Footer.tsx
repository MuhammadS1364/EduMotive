import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from 'lucide-react';
import { LOGO_URL, useContent, slugify } from '../lib/content';

export function socials(s: Record<string, string>) {
  return [
    { href: `mailto:${s.contactEmail || 'edumotive4@gmail.com'}`, icon: Mail, label: s.contactEmail || 'edumotive4@gmail.com' },
    { href: s.instagram || 'https://instagram.com/edumotivetri_16', icon: Instagram, label: 'Instagram' },
    { href: s.facebook || 'https://facebook.com/edumotivetri_16', icon: Facebook, label: 'Facebook' },
    { href: s.twitter || 'https://x.com/edumotivetri_16', icon: Twitter, label: 'X' },
  ];
}

export default function Footer() {
  const { data } = useContent();
  const s = data?.settings ?? {};
  return (
    <footer className="bg-secondary text-secondary-foreground mt-16">
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-4 text-center md:text-left">
        <div>
          <span className="inline-block aspect-[3.4/1] overflow-hidden h-12"><img src={LOGO_URL} alt="Edumotive" className="logo-on-dark w-full h-full object-cover" /></span>
          <p className="mt-3 text-sm opacity-75 max-w-xs mx-auto md:mx-0">Stories, essays and ideas from the students and scholars of Darul Huda Islamic University.</p>
          <div className="flex gap-2 mt-4 justify-center md:justify-start">
            {socials(s).map(({ href, icon: Icon, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" title={label} className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"><Icon className="h-4 w-4" /></a>
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-accent mb-3 font-sans font-bold">Sections</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {(data?.sections ?? []).map((x) => <li key={x.id}><Link to={`/section/${slugify(x.name)}`} className="hover:text-accent">{x.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest text-accent mb-3 font-sans font-bold">Edumotive</h4>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {[['/about', 'About us'], ['/articles', 'Articles'], ['/authors', 'Authors'], ['/issues', 'Magazine'], ['/contact', 'Join us'], ['/write', 'Submit work']].map(([to, l]) => (
              <li key={to}><Link to={to} className="hover:text-accent">{l}</Link></li>
            ))}
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <h4 className="text-xs uppercase tracking-widest text-accent mb-3 font-sans font-bold">Contact</h4>
          <a href={`mailto:${s.contactEmail || 'edumotive4@gmail.com'}`} className="flex gap-2 justify-center md:justify-start hover:text-accent"><Mail className="h-4 w-4 mt-0.5" />{s.contactEmail || 'edumotive4@gmail.com'}</a>
          <a href="https://instagram.com/edumotivetri_16" target="_blank" rel="noreferrer" className="flex gap-2 justify-center md:justify-start hover:text-accent"><Instagram className="h-4 w-4 mt-0.5" />@edumotivetri_16</a>
          <a href="tel:+918250583682" className="flex gap-2 justify-center md:justify-start hover:text-accent"><Phone className="h-4 w-4 mt-0.5" />+91 82505 83682</a>
          <p className="flex gap-2 justify-center md:justify-start opacity-85"><MapPin className="h-4 w-4 mt-0.5 shrink-0" />Darul Huda Islamic University, Chemmad, Kerala, India</p>
        </div>
      </div>
      <div className="border-t border-white/10 text-xs opacity-60 text-center py-4">© {new Date().getFullYear()} Edumotive Magazine. All rights reserved.</div>
    </footer>
  );
}

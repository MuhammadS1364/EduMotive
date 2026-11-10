import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@project/components/lib/utils';

type Slide = { id: string; image: string; link: string };

/** Full-width auto-sliding banner. Slides are managed in the admin panel. */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = slides.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [n, paused, go]);

  if (!n) return null;
  const s = slides[i % n];
  const img = <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" />;

  return (
    <section className="group relative w-full overflow-hidden bg-black aspect-video md:aspect-auto md:h-[81vh]"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (e.currentTarget.dataset.x = String(e.touches[0].clientX))}
      onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - Number(e.currentTarget.dataset.x); if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }}>
      <AnimatePresence initial={false}>
        <motion.div key={s.id} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8, ease: 'easeOut' }}>
          {s.link ? <a href={s.link} target={s.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" aria-label="Open banner">{img}</a> : img}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
        </motion.div>
      </AnimatePresence>
      {n > 1 && (<>
        {[-1, 1].map((d) => (
          <button key={d} onClick={() => go(d)} aria-label={d < 0 ? 'Previous slide' : 'Next slide'}
            className={cn('absolute top-1/2 -translate-y-1/2 z-10 hidden md:block rounded-full bg-black/20 p-2 text-white/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-primary-foreground', d < 0 ? 'left-8' : 'right-8')}>
            {d < 0 ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
          </button>
        ))}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 rounded-full border border-white/10 bg-black/30 p-1.5 backdrop-blur-md">
          {slides.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} aria-label={`Go to slide ${k + 1}`}
              className={cn('h-1.5 rounded-full transition-all duration-300', k === i % n ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white')} />
          ))}
        </div>
      </>)}
    </section>
  );
}

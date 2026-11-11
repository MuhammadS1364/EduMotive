import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@project/components/lib/utils';

type Slide = { id: string; image: string; link: string };
const isVideo = (u: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(u);

function Media({ s, active }: { s: Slide; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { const v = ref.current; if (!v) return; if (active) { v.currentTime = 0; v.play().catch(() => {}); } else v.pause(); }, [active]);
  const el = isVideo(s.image)
    ? <video ref={ref} src={s.image} muted loop playsInline preload="metadata" className="h-full w-full object-cover" />
    : <img src={s.image} alt="" draggable={false} className="h-full w-full object-cover" />;
  return s.link
    ? <a href={s.link} target={s.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block h-full w-full">{el}</a>
    : el;
}

/** Horizontal sliding banner — slides move right-to-left every 5 seconds. */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const n = slides.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setTimeout(() => go(1), 5000);
    return () => clearTimeout(t);
  }, [i, n, paused, go]);

  if (!n) return null;

  const end = () => { if (Math.abs(drag) > 50) go(drag < 0 ? 1 : -1); setDrag(0); startX.current = null; setPaused(false); };

  return (
    <section className="group relative w-full overflow-hidden bg-black aspect-[16/9] md:aspect-[21/9] max-h-[85vh] select-none touch-pan-y"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); if (startX.current !== null) end(); }}
      onPointerDown={(e) => { startX.current = e.clientX; setPaused(true); }}
      onPointerMove={(e) => { if (startX.current !== null) setDrag(e.clientX - startX.current); }}
      onPointerUp={end}>
      <div className={cn('flex h-full', !drag && 'transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]')}
        style={{ transform: `translateX(calc(${-i * 100}% + ${drag}px))` }}>
        {slides.map((s, k) => (
          <div key={s.id} className="relative h-full w-full shrink-0" aria-hidden={k !== i}>
            <Media s={s} active={k === i} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {n > 1 && (<>
        {[-1, 1].map((d) => (
          <button key={d} onClick={() => go(d)} aria-label={d < 0 ? 'Previous slide' : 'Next slide'}
            className={cn('absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-primary hover:text-primary-foreground md:opacity-0 md:group-hover:opacity-100', d < 0 ? 'left-3 md:left-6' : 'right-3 md:right-6')}>
            {d < 0 ? <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" /> : <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />}
          </button>
        ))}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((x, k) => (
            <button key={x.id} onClick={() => setI(k)} aria-label={`Go to slide ${k + 1}`}
              className="relative h-1.5 w-8 overflow-hidden rounded-full bg-white/40">
              {k === i && <span key={`${i}-${paused}`} className={cn('absolute inset-y-0 left-0 bg-white', paused ? 'w-full' : 'animate-[heroprogress_5s_linear_forwards]')} />}
              {k < i && <span className="absolute inset-0 bg-white/80" />}
            </button>
          ))}
        </div>
        <style>{'@keyframes heroprogress{from{width:0}to{width:100%}}'}</style>
      </>)}
    </section>
  );
}

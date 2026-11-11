import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@project/components/lib/utils';

type Slide = { id: string; image: string; link: string };
const isVideo = (u: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(u);
const DUR = 1100;

function Media({ s, active }: { s: Slide; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { const v = ref.current; if (!v) return; if (active) v.play().catch(() => {}); else v.pause(); }, [active]);
  const cls = cn('h-full w-full object-cover transition-transform ease-out', active ? 'scale-105 duration-[6000ms]' : 'scale-100 duration-[1100ms]');
  const el = isVideo(s.image)
    ? <video ref={ref} src={s.image} muted loop playsInline preload="metadata" className={cls} />
    : <img src={s.image} alt="" draggable={false} className={cls} />;
  return s.link
    ? <a href={s.link} target={s.link.startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="block h-full w-full overflow-hidden">{el}</a>
    : <div className="h-full w-full overflow-hidden">{el}</div>;
}

/** Infinite, smooth horizontal banner — always slides forward, every 5 seconds. */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const n = slides.length;
  // Track = [last, ...slides, first] so the loop never jumps visibly.
  const track = n > 1 ? [slides[n - 1], ...slides, slides[0]] : slides;
  const [pos, setPos] = useState(n > 1 ? 1 : 0);
  const [anim, setAnim] = useState(true);
  const [paused, setPaused] = useState(false);
  const [drag, setDrag] = useState(0);
  const startX = useRef<number | null>(null);
  const busy = useRef(false);
  const real = n > 1 ? (pos - 1 + n) % n : 0;

  const go = useCallback((d: number) => {
    if (busy.current || n < 2) return;
    busy.current = true; setAnim(true); setPos((p) => p + d);
  }, [n]);

  const onEnd = () => {
    busy.current = false;
    if (pos === 0 || pos === n + 1) { setAnim(false); setPos(pos === 0 ? n : 1); }
  };
  useEffect(() => { if (!anim) requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true))); }, [anim]);

  useEffect(() => {
    if (n < 2 || paused) return;
    const t = setTimeout(() => go(1), 5000);
    return () => clearTimeout(t);
  }, [pos, n, paused, go]);

  if (!n) return null;
  const release = () => { if (startX.current === null) return; if (Math.abs(drag) > 50) go(drag < 0 ? 1 : -1); setDrag(0); startX.current = null; };

  return (
    <section className="group relative w-full overflow-hidden bg-black aspect-[16/9] md:aspect-[21/9] max-h-[85vh] select-none touch-pan-y animate-[heroin_1s_ease-out]"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); release(); }}
      onPointerDown={(e) => { if (!busy.current) startX.current = e.clientX; }}
      onPointerMove={(e) => { if (startX.current !== null) setDrag(e.clientX - startX.current); }}
      onPointerUp={release}>
      <div className="flex h-full" onTransitionEnd={(e) => e.target === e.currentTarget && onEnd()}
        style={{ transform: `translate3d(calc(${-pos * 100}% + ${drag}px),0,0)`, transition: anim && !drag ? `transform ${DUR}ms cubic-bezier(0.77,0,0.175,1)` : 'none', willChange: 'transform' }}>
        {track.map((s, k) => (
          <div key={`${s.id}-${k}`} className="relative h-full w-full shrink-0" aria-hidden={k !== pos}>
            <Media s={s} active={k === pos} />
          </div>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {n > 1 && (<>
        {[-1, 1].map((d) => (
          <button key={d} onClick={() => go(d)} aria-label={d < 0 ? 'Previous slide' : 'Next slide'}
            className={cn('absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-primary-foreground md:opacity-0 md:group-hover:opacity-100', d < 0 ? 'left-3 md:left-6' : 'right-3 md:right-6')}>
            {d < 0 ? <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" /> : <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />}
          </button>
        ))}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((x, k) => (
            <button key={x.id} onClick={() => { if (!busy.current && k !== real) { busy.current = true; setAnim(true); setPos(k + 1); } }} aria-label={`Go to slide ${k + 1}`}
              className="relative h-1.5 w-8 overflow-hidden rounded-full bg-white/40">
              {k === real && <span key={`${pos}-${paused}`} className={cn('absolute inset-y-0 left-0 bg-white', paused ? 'w-full' : 'animate-[heroprogress_5s_linear_forwards]')} />}
            </button>
          ))}
        </div>
      </>)}
      <style>{'@keyframes heroprogress{from{width:0}to{width:100%}}@keyframes heroin{from{opacity:0;transform:scale(1.02)}to{opacity:1;transform:none}}'}</style>
    </section>
  );
}

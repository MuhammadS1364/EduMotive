import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SELECTOR = 'main section, main h1, main h2, main article, main [class*="grid"] > *, main [class*="space-y"] > *';

/** Fades and slides page content into view as the visitor scrolls. */
export default function useScrollReveal() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('reveal-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    const scan = () => document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (el.dataset.reveal) return;
      el.dataset.reveal = '1';
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight) { el.classList.add('reveal-in'); return; }
      const sib = el.parentElement ? Array.from(el.parentElement.children).indexOf(el) % 4 : 0;
      el.style.transitionDelay = `${sib * 80}ms`;
      el.classList.add('reveal');
      io.observe(el);
    });
    scan();
    const mo = new MutationObserver(scan);
    const main = document.querySelector('main');
    if (main) mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);
}

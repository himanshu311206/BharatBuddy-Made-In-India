import { useEffect, useRef } from 'react';

/**
 * CustomCursor — small dot + trailing ring that follow the pointer.
 * Fine pointers only; automatically disabled on touch devices.
 * Styles already live in 01-base.css (.bb-cursor-*).
 */
export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.documentElement.classList.add('bb-cursor-on');

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    let rx = mx;
    let ry = my;
    let raf = null;

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx - 3.5}px, ${my - 3.5}px, 0)`;
    };

    const tick = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx - 19}px, ${ry - 19}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const onOver = (e) => {
      const grow = e.target.closest('a, button, [data-cursor="grow"], .bb-btn, .bb-feature, .bb-whatis__card');
      if (grow) {
        dot.classList.add('bb-cursor-dot--hover');
        ring.classList.add('bb-cursor-ring--hover');
      } else {
        dot.classList.remove('bb-cursor-dot--hover');
        ring.classList.remove('bb-cursor-ring--hover');
      }
    };

    const onDown = () => ring.classList.add('bb-cursor-ring--down');
    const onUp = () => ring.classList.remove('bb-cursor-ring--down');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    raf = requestAnimationFrame(tick);

    return () => {
      document.documentElement.classList.remove('bb-cursor-on');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="bb-cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="bb-cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}

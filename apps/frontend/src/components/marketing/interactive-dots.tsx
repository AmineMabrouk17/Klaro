'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@klaro/ui';

type InteractiveDotsProps = {
  className?: string;
  /** Spacing between dots in CSS px. */
  spacing?: number;
  /** Radius (CSS px) within which the cursor influences dots. */
  influence?: number;
  /** Base radius of each dot. */
  baseRadius?: number;
  /** Max radius the dot can grow to under the cursor. */
  maxRadius?: number;
  /** Base opacity of dots. */
  baseOpacity?: number;
  /** Hex color for dots and accent. */
  color?: string;
  accentColor?: string;
};

/**
 * High-performance dotted-grid background that responds to the cursor.
 * Implemented on a single <canvas>, throttled via requestAnimationFrame.
 * Falls back gracefully when cursor leaves: dots fade back to baseline.
 */
export function InteractiveDots({
  className,
  spacing = 26,
  influence = 140,
  baseRadius = 1,
  maxRadius = 2.4,
  baseOpacity = 0.12,
  color = '255,255,255',
  accentColor = '255,122,69',
}: InteractiveDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const rafRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      if (!canvas || !wrap || !ctx) return;
      const rect = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    let t = 0;

    function render() {
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      const cols = Math.floor(w / spacing) + 2;
      const rows = Math.floor(h / spacing) + 2;
      const offsetX = (w - (cols - 1) * spacing) / 2;
      const offsetY = (h - (rows - 1) * spacing) / 2;

      const px = pointer.current.x;
      const py = pointer.current.y;
      const active = pointer.current.active;
      t += reduceMotion ? 0 : 0.012;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = offsetX + i * spacing;
          const y = offsetY + j * spacing;

          let scale = 1;
          let alphaBoost = 0;
          let accentMix = 0;

          if (active) {
            const dx = x - px;
            const dy = y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < influence) {
              const k = 1 - dist / influence;
              const eased = k * k;
              scale = 1 + eased * (maxRadius / baseRadius - 1);
              alphaBoost = eased * 0.55;
              accentMix = eased * 0.85;
            }
          }

          // gentle idle shimmer
          if (!reduceMotion) {
            const shimmer = Math.sin(t + (i + j) * 0.3) * 0.08;
            alphaBoost += Math.max(0, shimmer);
          }

          const alpha = Math.min(0.95, baseOpacity + alphaBoost);
          const r = baseRadius * scale;

          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          if (accentMix > 0.05) {
            ctx.fillStyle = `rgba(${accentColor}, ${alpha})`;
          } else {
            ctx.fillStyle = `rgba(${color}, ${alpha})`;
          }
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(render);
    }

    // Listen on window so the dots react even when the cursor is hovering
    // sibling content stacked on top of the canvas (score card, text, buttons).
    function onMove(e: PointerEvent) {
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (x < -40 || y < -40 || x > rect.width + 40 || y > rect.height + 40) {
        pointer.current.active = false;
        return;
      }
      pointer.current.x = x;
      pointer.current.y = y;
      pointer.current.active = true;
    }

    function onWindowLeave() {
      pointer.current.active = false;
    }

    resize();
    render();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onWindowLeave);
    document.addEventListener('mouseleave', onWindowLeave);

    return () => {
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onWindowLeave);
      document.removeEventListener('mouseleave', onWindowLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [spacing, influence, baseRadius, maxRadius, baseOpacity, color, accentColor]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn('absolute inset-0 overflow-hidden', className)}
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: 'none' }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute inset-0 marketing-vignette" />
    </div>
  );
}

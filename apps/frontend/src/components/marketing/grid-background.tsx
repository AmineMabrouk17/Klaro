import { cn } from '@klaro/ui';

/**
 * Static dotted-grid + vignette used as the marketing-shell background.
 * The interactive cursor-reactive dots live inside the hero (see InteractiveDots).
 */
export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0 marketing-grid" />
      <div className="absolute inset-0 marketing-vignette" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
    </div>
  );
}

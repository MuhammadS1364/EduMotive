import { cn } from '@project/components/lib/utils';

type B = { name: string; emoji: string; icon?: string; description: string };

export default function AuthorBadges({ badges, showLabel, className }: { badges: B[]; showLabel?: boolean; className?: string }) {
  if (!badges.length) return null;
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges.map((b) => (
        <span key={b.name} title={`${b.name}${b.description ? ' — ' + b.description : ''}`}
          className="inline-flex items-center gap-1 rounded-full border border-accent/60 bg-accent/25 px-2.5 py-0.5 text-xs font-semibold">
          {b.icon ? <img src={b.icon} alt="" className="h-4 w-4 object-contain" /> : <span>{b.emoji}</span>}{(showLabel || badges.length <= 2) && b.name}
        </span>
      ))}
    </div>
  );
}

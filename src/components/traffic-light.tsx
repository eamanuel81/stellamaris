import { cn } from '@/lib/utils';
import { KIND_TITLES, LEVEL_LABELS, normalizeLevel, type Level, type LevelKind } from '@/lib/traffic-light';

const DOT: Record<Level, string> = { 1: 'bg-green-500', 2: 'bg-amber-400', 3: 'bg-red-500' };
const CHIP: Record<Level, string> = {
  1: 'border-green-400 bg-green-100 text-green-800',
  2: 'border-amber-400 bg-amber-100 text-amber-800',
  3: 'border-red-400 bg-red-100 text-red-800',
};

// Etiqueta de solo lectura: punto de color + texto
export function LevelBadge({ level, kind }: { level: unknown; kind: LevelKind }) {
  const l = normalizeLevel(level);
  if (!l) return null;
  return (
    <span
      title={KIND_TITLES[kind]}
      className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold', CHIP[l])}
    >
      <span className={cn('h-2 w-2 rounded-full', DOT[l])} />
      {LEVEL_LABELS[kind][l]}
    </span>
  );
}

// Selector de tres botones (verde, amarillo, rojo). Con allowEmpty, tocar el activo lo borra.
export function LevelPicker({
  value, onChange, kind, allowEmpty = false, disabled = false,
}: { value: unknown; onChange: (level: Level | null) => void; kind: LevelKind; allowEmpty?: boolean; disabled?: boolean }) {
  const current = normalizeLevel(value);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={KIND_TITLES[kind]}>
      {([1, 2, 3] as Level[]).map(l => (
        <button
          key={l}
          type="button"
          disabled={disabled}
          aria-pressed={current === l}
          onClick={() => onChange(current === l && allowEmpty ? null : l)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-50',
            current === l ? CHIP[l] : 'border-border bg-background text-muted-foreground hover:bg-muted'
          )}
        >
          <span className={cn('h-2.5 w-2.5 rounded-full', DOT[l])} />
          {LEVEL_LABELS[kind][l]}
        </button>
      ))}
    </div>
  );
}

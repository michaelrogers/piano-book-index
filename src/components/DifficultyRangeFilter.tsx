import type { DifficultyLabel } from '../lib/types';

const LABELS: DifficultyLabel[] = [
  'Beginner',
  'Early Intermediate',
  'Intermediate',
  'Late Intermediate',
  'Early Advanced',
  'Advanced',
];

const SHORT_LABELS = ['Beg', 'Early Int', 'Int', 'Late Int', 'Early Adv', 'Adv'];

const SEGMENT_COLORS = [
  'bg-green-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
];

interface Props {
  min: number | null;
  max: number | null;
  onChange: (min: number | null, max: number | null) => void;
}

export default function DifficultyRangeFilter({ min, max, onChange }: Props) {
  const handleClick = (index: number) => {
    if (min === null) {
      // Nothing selected — set single level
      onChange(index, index);
    } else if (min === index && max === index) {
      // Clicking the only selected segment — clear
      onChange(null, null);
    } else if (min === index && max !== null && max > index) {
      // Clicking the min end — shrink from left
      onChange(index + 1, max);
    } else if (max === index && min !== null && min < index) {
      // Clicking the max end — shrink from right
      onChange(min, index - 1);
    } else {
      // Extend range to include clicked segment
      const newMin = min !== null ? Math.min(min, index) : index;
      const newMax = max !== null ? Math.max(max, index) : index;
      onChange(newMin, newMax);
    }
  };

  const isActive = (i: number) =>
    min !== null && max !== null && i >= min && i <= max;

  const hasSelection = min !== null;

  return (
    <div class="flex flex-col gap-1">
      <div class="flex items-center gap-1">
        <div class="flex min-w-0 flex-1 cursor-pointer gap-px" role="group" aria-label="Difficulty range filter">
          {LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => handleClick(i)}
              title={label}
              aria-pressed={isActive(i)}
              class={`h-7 min-w-0 flex-1 transition-all first:rounded-l-md last:rounded-r-md ${SEGMENT_COLORS[i]} ${
                !hasSelection
                  ? 'opacity-40 hover:opacity-70'
                  : isActive(i)
                    ? 'opacity-100 ring-1 ring-inset ring-white/30'
                    : 'opacity-20 hover:opacity-40'
              }`}
            />
          ))}
        </div>
        {hasSelection && (
          <button
            type="button"
            onClick={() => onChange(null, null)}
            class="ml-1 shrink-0 rounded p-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Clear difficulty filter"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        )}
      </div>
      <div class="flex gap-px text-[9px] leading-none text-gray-400 dark:text-gray-500">
        {SHORT_LABELS.map((sl, i) => (
          <span
            key={sl}
            class={`min-w-0 flex-1 text-center ${isActive(i) ? 'font-medium text-gray-600 dark:text-gray-300' : ''}`}
          >
            {sl}
          </span>
        ))}
      </div>
    </div>
  );
}

export { LABELS as DIFFICULTY_LABELS };

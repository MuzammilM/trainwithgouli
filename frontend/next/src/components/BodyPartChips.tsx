import { BODY_PARTS } from '@/lib/body-parts'

type Props = { selected?: string[] }

/**
 * Checkbox chips group for exercise body_part tags.
 * IRON/RED: small uppercase mono chips; accent border when checked.
 */
export function BodyPartChips({ selected = [] }: Props) {
  return (
    <fieldset>
      <legend className="block text-sm font-bold uppercase mb-1">Body parts</legend>
      <div className="flex flex-wrap gap-2">
        {BODY_PARTS.map((part) => (
          <label key={part} className="cursor-pointer">
            <input
              type="checkbox"
              name="body_part[]"
              value={part}
              defaultChecked={selected.includes(part)}
              className="peer sr-only"
            />
            <span className="inline-block font-mono text-[10px] uppercase border-2 border-[var(--border)] px-2 py-1 peer-checked:border-[var(--accent)] hover:border-[var(--accent)]">
              {part}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

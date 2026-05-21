'use client'

interface ScribbleNotePanelProps {
  value: string
  emoji: string
  onValue: (value: string) => void
  onEmoji: (emoji: string) => void
}

const EMOJIS = ['❤️', '⭐', '✨', '🫶', '🔥']

export default function ScribbleNotePanel({ value, emoji, onValue, onEmoji }: ScribbleNotePanelProps) {
  return (
    <section className="sketch-panel p-4">
      <p className="font-display text-2xl font-bold text-ink-900">Note / reaction</p>
      <p className="mt-1 text-xs leading-5 text-ink-500">
        This stays outside the shirt drawing layer. It can later appear as a dashboard reaction.
      </p>
      <textarea
        value={value}
        onChange={event => onValue(event.target.value.slice(0, 180))}
        placeholder="Leave a small note with your scribble..."
        className="mt-4 min-h-[110px] w-full resize-none rounded-2xl border border-black/10 bg-paper-50 p-3 text-sm outline-none transition focus:border-ink-900"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {EMOJIS.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => onEmoji(item)}
            className={`min-h-11 min-w-11 rounded-full border text-lg transition ${emoji === item ? 'border-ink-900 bg-paper-300' : 'border-black/10 bg-white hover:bg-black/5'}`}
          >
            {item}
          </button>
        ))}
      </div>
    </section>
  )
}

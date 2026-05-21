export interface HandwritingStyle {
  id: string
  label: string
  fontFamily: string
  defaultSize: number
  defaultWeight?: number
  sampleText: string
}

export const HANDWRITING_STYLES = [
  {
    // Dedicated cursive signature font powered by Google's "Caveat" (already
    // loaded globally in app/layout.tsx). Used by Signature mode and also
    // available to any text/sticky note that wants a flowing handwritten feel.
    id: 'signature',
    label: 'Signature',
    fontFamily: '"Caveat", "Patrick Hand", cursive',
    defaultSize: 36,
    defaultWeight: 600,
    sampleText: 'Your name here',
  },
  {
    id: 'casual',
    label: 'Casual',
    fontFamily: '"Patrick Hand", "Comic Sans MS", "Bradley Hand", cursive',
    defaultSize: 28,
    sampleText: 'Will miss you!',
  },
  {
    id: 'neat',
    label: 'Neat',
    fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
    defaultSize: 24,
    sampleText: 'Best memories',
  },
  {
    id: 'marker',
    label: 'Marker',
    fontFamily: '"Trebuchet MS", "Comic Sans MS", cursive',
    defaultSize: 30,
    defaultWeight: 700,
    sampleText: 'Legend!',
  },
  {
    id: 'playful',
    label: 'Playful',
    fontFamily: '"Comic Sans MS", "Chalkboard SE", cursive',
    defaultSize: 30,
    sampleText: 'You rock!',
  },
  {
    id: 'tiny-note',
    label: 'Tiny note',
    fontFamily: '"Segoe Print", "Comic Sans MS", cursive',
    defaultSize: 18,
    sampleText: 'Keep shining',
  },
  {
    id: 'bold-farewell',
    label: 'Bold farewell',
    fontFamily: '"Trebuchet MS", "Comic Sans MS", cursive',
    defaultSize: 34,
    defaultWeight: 800,
    sampleText: 'Never change!',
  },
] as const satisfies readonly HandwritingStyle[]

export type HandwritingStyleId = (typeof HANDWRITING_STYLES)[number]['id']

export const DEFAULT_HANDWRITING_STYLE_ID: HandwritingStyleId = 'casual'
export const SIGNATURE_HANDWRITING_STYLE_ID: HandwritingStyleId = 'signature'

export function getHandwritingStyle(id?: string | null): HandwritingStyle {
  return HANDWRITING_STYLES.find(style => style.id === id) ?? HANDWRITING_STYLES[0]
}

export interface ScribblSticker {
  id: string
  label: string
  symbol: string
  assetPath: string
}

export const SCRIBBL_STICKERS = [
  { id: 'heart', label: 'Heart', symbol: '♡', assetPath: '/src/assets/scribbl/stickers/heart.svg' },
  { id: 'star', label: 'Star', symbol: '☆', assetPath: '/src/assets/scribbl/stickers/star.svg' },
  { id: 'smile', label: 'Smile', symbol: '☺', assetPath: '/src/assets/scribbl/stickers/smile.svg' },
  { id: 'crown', label: 'Crown', symbol: '♕', assetPath: '/src/assets/scribbl/stickers/crown.svg' },
  { id: 'lightning', label: 'Lightning', symbol: '⚡', assetPath: '/src/assets/scribbl/stickers/lightning.svg' },
  { id: 'sparkle', label: 'Sparkle', symbol: '✦', assetPath: '/src/assets/scribbl/stickers/sparkle.svg' },
  { id: 'fire', label: 'Fire', symbol: '🔥', assetPath: '/src/assets/scribbl/stickers/fire.svg' },
  { id: 'flower', label: 'Flower', symbol: '✿', assetPath: '/src/assets/scribbl/stickers/flower.svg' },
  { id: 'paper-plane', label: 'Paper plane', symbol: '✈', assetPath: '/src/assets/scribbl/stickers/paper-plane.svg' },
  { id: 'arrow', label: 'Arrow', symbol: '→', assetPath: '/src/assets/scribbl/stickers/arrow.svg' },
  { id: 'bear-doodle', label: 'Bear doodle', symbol: 'ʕ•ᴥ•ʔ', assetPath: '/src/assets/scribbl/stickers/bear-doodle.svg' },
  { id: 'speech-bubble', label: 'Speech bubble', symbol: '“”', assetPath: '/src/assets/scribbl/stickers/speech-bubble.svg' },
] as const satisfies readonly ScribblSticker[]

export type ScribblStickerId = (typeof SCRIBBL_STICKERS)[number]['id']

export function getSticker(id?: string | null): ScribblSticker {
  return SCRIBBL_STICKERS.find(sticker => sticker.id === id) ?? SCRIBBL_STICKERS[0]
}

export const colors = {
  bg: {
    chat: '#0f0f11',
    panel: '#1a1a1d',
    elevated: '#242428',
    surface: '#2a2a2e',
  },
  bubble: {
    mine: '#2b5278',
    other: '#1b1b1e',
    mineHover: '#31628c',
    otherHover: '#232326',
  },
  accent: '#6ab2f5',
  accentDim: '#5a9fd9',
  text: {
    primary: '#ffffff',
    secondary: '#a3a3a3',
    muted: '#6c7887',
  },
  danger: '#ef5350',
  success: '#4caf50',
} as const

export const userNickColors: Record<number, string> = {
  1: '#6CB2EB',
  2: '#B794F4',
  3: '#68D391',
} as const

export const accentColors = [
  '#6ab2f5',
  '#5a9fd9',
  '#4a8bc4',
] as const

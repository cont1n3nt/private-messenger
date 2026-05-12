export const glass = {
  default: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
    backdropFilter: 'blur(24px) saturate(160%) brightness(1.05)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  strong: {
    background: '#242428',
    backdropFilter: 'none',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  subtle: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
    backdropFilter: 'blur(20px) saturate(150%) brightness(1.03)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  },
  header: {
    background: 'rgba(15, 15, 17, 0.7)',
    backdropFilter: 'blur(20px) saturate(160%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.03), 0 4px 20px rgba(0, 0, 0, 0.15)',
  },
  mine: {
    background: '#2b5278',
    backdropFilter: 'none',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
  },
  other: {
    background: '#1b1b1e',
    backdropFilter: 'none',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
} as const

export type GlassVariant = keyof typeof glass

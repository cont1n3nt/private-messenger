export const glass = {
  default: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.09) 100%)',
    backdropFilter: 'blur(60px) saturate(200%) brightness(1.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(255,255,255,0.03)',
  },
  strong: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.10) 100%)',
    backdropFilter: 'blur(60px) saturate(220%) brightness(1.10)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(255,255,255,0.04)',
  },
  subtle: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
    backdropFilter: 'blur(40px) saturate(180%) brightness(1.06)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
  },
  mine: {
    background: 'linear-gradient(135deg, rgba(0,212,224,0.14) 0%, rgba(0,212,224,0.07) 50%, rgba(168,85,247,0.05) 100%)',
    backdropFilter: 'blur(32px) saturate(180%) brightness(1.06)',
    border: '1px solid rgba(0, 212, 224, 0.15)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 1px 0 rgba(0,212,224,0.06)',
  },
  other: {
    background: 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.05) 100%)',
    backdropFilter: 'blur(32px) saturate(180%) brightness(1.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 2px 10px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.08)',
  },
} as const

export type GlassVariant = keyof typeof glass

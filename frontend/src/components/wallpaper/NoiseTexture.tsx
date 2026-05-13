import { memo } from 'react'

const NoiseTexture = memo(function NoiseTexture() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden opacity-[0.012]">
      <svg
        className="w-[200%] h-[200%]"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          animation: 'noise-anim 60s steps(10) infinite',
          willChange: 'transform',
          transform: 'translateZ(0)',
        }}
      >
        <filter id="noise-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="50%"
          height="50%"
          filter="url(#noise-filter)"
        />
      </svg>
    </div>
  )
})

export default NoiseTexture

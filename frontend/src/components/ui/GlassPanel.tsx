import { type ElementType, type ComponentPropsWithoutRef, forwardRef } from 'react'
import clsx from 'clsx'
import type { GlassVariant } from '../../theme/glass'
import { glass } from '../../theme/glass'

type GlassPanelProps<C extends ElementType = 'div'> = {
  as?: C
  variant?: GlassVariant
  className?: string
  children: React.ReactNode
} & Omit<ComponentPropsWithoutRef<C>, 'as' | 'variant' | 'className' | 'children'>

const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  function GlassPanel(
    { as: Component = 'div', variant = 'default', className, children, ...rest },
    ref,
  ) {
    const style = glass[variant]

    return (
      <Component
        ref={ref as React.Ref<HTMLDivElement>}
        className={clsx('rounded-card relative highlight-sheen', className)}
        style={{
          background: style.background,
          backdropFilter: style.backdropFilter,
          WebkitBackdropFilter: style.backdropFilter,
          border: style.border,
          boxShadow: style.boxShadow,
        }}
        {...rest}
      >
        {children}
      </Component>
    )
  },
)

export default GlassPanel

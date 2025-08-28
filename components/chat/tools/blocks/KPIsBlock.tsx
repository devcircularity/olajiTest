// components/chat/tools/blocks/KPIsBlock.tsx
'use client'
import { KPIsBlock as KPIsBlockType, Action } from '../types'
import { formatValue } from '../utils/formatters'
import { getVariantClasses } from '../utils/styles'

interface Props {
  block: KPIsBlockType
  onAction?: (action: Action) => void
}

export function KPIsBlock({ block, onAction }: Props) {
  const handleItemClick = (action: Action | undefined) => {
    if (action && onAction) {
      onAction(action)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {block.items.map((item, index) => {
        const isClickable = !!item.action
        const variantClasses = getVariantClasses(item.variant || 'primary')
        
        return (
          <div
            key={index}
            className={`
              card p-4 transition-all duration-200
              ${isClickable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
            `}
            onClick={() => handleItemClick(item.action)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                  {item.label}
                </p>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatValue(item.value, item.format)}
                </p>
              </div>
              
              {item.icon && (
                <div className={`p-2 rounded-lg ${variantClasses.bg}`}>
                  <div className={`w-5 h-5 ${variantClasses.text}`}>
                    {/* Icon placeholder - you can replace with actual icon library */}
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            
            {item.variant && (
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-2 ${variantClasses.badge}`}>
                {item.variant}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
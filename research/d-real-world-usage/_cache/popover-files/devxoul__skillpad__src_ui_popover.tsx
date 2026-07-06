import { Popover as BasePopover } from '@base-ui-components/react/popover'
import { clsx } from 'clsx'
import { type ComponentPropsWithoutRef, forwardRef } from 'react'

export const PopoverRoot = BasePopover.Root

export const PopoverTrigger = forwardRef<HTMLButtonElement, ComponentPropsWithoutRef<typeof BasePopover.Trigger>>(
  ({ className, ...props }, ref) => <BasePopover.Trigger ref={ref} className={className} {...props} />,
)
PopoverTrigger.displayName = 'PopoverTrigger'

export const PopoverPortal = BasePopover.Portal

export const PopoverPositioner = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof BasePopover.Positioner>>(
  ({ className, ...props }, ref) => <BasePopover.Positioner ref={ref} className={clsx('z-50', className)} {...props} />,
)
PopoverPositioner.displayName = 'PopoverPositioner'

export const PopoverContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof BasePopover.Popup>>(
  ({ className, ...props }, ref) => (
    <BasePopover.Popup
      ref={ref}
      className={clsx(
        'max-w-72 p-3',
        'rounded-lg bg-surface text-foreground backdrop-blur-xl',
        'border border-foreground/10 shadow-lg',
        'transition-all duration-150',
        'data-[starting-style]:scale-95 data-[starting-style]:opacity-0',
        'data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
        className,
      )}
      {...props}
    />
  ),
)
PopoverContent.displayName = 'PopoverContent'

export const PopoverArrow = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof BasePopover.Arrow>>(
  ({ className, ...props }, ref) => (
    <BasePopover.Arrow
      ref={ref}
      className={clsx(
        'data-[side=bottom]:top-[-8px] data-[side=top]:bottom-[-8px]',
        'data-[side=left]:right-[-8px] data-[side=right]:left-[-8px]',
        className,
      )}
      {...props}
    >
      <svg width="16" height="8" viewBox="0 0 16 8" fill="none" aria-hidden="true">
        <path
          d="M0 8L6.59 1.41C7.37 0.63 8.63 0.63 9.41 1.41L16 8"
          className="fill-background/95 stroke-foreground/10"
        />
      </svg>
    </BasePopover.Arrow>
  ),
)
PopoverArrow.displayName = 'PopoverArrow'

export {
  PopoverRoot as Root,
  PopoverTrigger as Trigger,
  PopoverPortal as Portal,
  PopoverPositioner as Positioner,
  PopoverContent as Content,
  PopoverArrow as Arrow,
}

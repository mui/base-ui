'use client';

import { Drawer as BaseDrawer } from '@base-ui/react/drawer';
import { cva, type VariantProps } from 'class-variance-authority';
import { buttonVariants } from './button';
import { cn } from '#utils';

export function Drawer({
  swipeDirection = 'right',
  ...props
}: React.ComponentProps<typeof BaseDrawer.Root>) {
  return (
    <BaseDrawer.Root
      data-slot="drawer"
      swipeDirection={swipeDirection}
      {...props}
    />
  );
}

export function DrawerTrigger({
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Trigger>) {
  return (
    <BaseDrawer.Trigger data-slot="drawer-trigger" {...props}>
      {children}
    </BaseDrawer.Trigger>
  );
}

export const drawerPopupVariants = cva(
  [
    'bg-drawer text-drawer-foreground',
    'ring ring-drawer-border shadow outline-none',
    'flex flex-col',
    'data-[swiping]:select-none',
  ],
  {
    variants: {
      direction: {
        bottom: [
          'relative w-full rounded-t-xl max-h-[calc(80vh+3rem)]',
          '[height:var(--drawer-height,auto)]',
          '-mb-[3rem]',
          '[padding-bottom:max(3rem,calc(var(--drawer-snap-point-offset,0px)+3rem))]',
          'overflow-visible touch-auto',
          // Stacking variables
          '[--bleed:3rem] [--peek:1rem] [--stack-step:0.05]',
          '[--stack-progress:clamp(0,var(--drawer-swipe-progress),1)]',
          '[--stack-peek-offset:max(0px,calc((var(--nested-drawers,0)-var(--stack-progress))*var(--peek)))]',
          '[--scale-base:calc(max(0,1-(var(--nested-drawers,0)*var(--stack-step))))]',
          '[--scale:clamp(0,calc(var(--scale-base)+(var(--stack-step)*var(--stack-progress))),1)]',
          '[--shrink:calc(1-var(--scale))]',
          '[--height:max(0px,calc(var(--drawer-frontmost-height,var(--drawer-height))-var(--bleed)))]',
          // Transform with stacking + snap point offset
          '[transform-origin:50%_calc(100%-var(--bleed))]',
          '[transform:translateY(calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)-var(--stack-peek-offset)-(var(--shrink)*var(--height))))_scale(var(--scale))]',
          // Transition
          '[transition:transform_450ms_cubic-bezier(0.32,0.72,0,1),height_450ms_cubic-bezier(0.32,0.72,0,1),box-shadow_450ms_cubic-bezier(0.32,0.72,0,1),padding-bottom_450ms_cubic-bezier(0.32,0.72,0,1)]',
          // Enter/exit
          'data-[starting-style]:[transform:translateY(calc(100%-var(--bleed)+2px))]',
          'data-[ending-style]:[transform:translateY(calc(100%-var(--bleed)+2px))]',
          'data-[starting-style]:[padding-bottom:3rem]',
          'data-[ending-style]:[padding-bottom:3rem]',
          'data-[ending-style]:shadow-none',
          'data-[ending-style]:[transition-duration:calc(var(--drawer-swipe-strength)*400ms)]',
          // Nested overlay
          'after:absolute after:inset-0 after:rounded-[inherit]',
          'after:bg-transparent after:pointer-events-none after:content-[""]',
          'after:transition-[background-color] after:duration-[450ms] after:ease-[cubic-bezier(0.32,0.72,0,1)]',
          'data-[nested-drawer-open]:after:bg-black/5',
          'data-[nested-drawer-open]:h-[calc(var(--height)+var(--bleed))]',
          'data-[nested-drawer-open]:overflow-hidden',
          'data-[nested-drawer-swiping]:[transition-duration:0ms]',
        ],
        top: [
          'absolute inset-x-0 top-0 rounded-b-xl max-h-[85dvh] overflow-hidden',
          'transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'data-[swiping]:duration-0',
          'data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
          '[transform:translateY(calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px)))]',
          'data-[starting-style]:[transform:translateY(-100%)]',
          'data-[ending-style]:[transform:translateY(-100%)]',
        ],
        right: [
          'absolute inset-y-0 right-0 rounded-l-xl max-w-md w-full h-full overflow-hidden',
          'transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'data-[swiping]:duration-0',
          'data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
          '[transform:translateX(var(--drawer-swipe-movement-x,0px))]',
          'data-[starting-style]:[transform:translateX(100%)]',
          'data-[ending-style]:[transform:translateX(100%)]',
        ],
        left: [
          'absolute inset-y-0 left-0 rounded-r-xl max-w-md w-full h-full overflow-hidden',
          'transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          'data-[swiping]:duration-0',
          'data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
          '[transform:translateX(var(--drawer-swipe-movement-x,0px))]',
          'data-[starting-style]:[transform:translateX(-100%)]',
          'data-[ending-style]:[transform:translateX(-100%)]',
        ],
      },
    },
    defaultVariants: { direction: 'right' },
  },
);

export function DrawerPopup({
  className,
  children,
  direction = 'right',
  portalContainer,
  backdrop = true,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Popup> &
  VariantProps<typeof drawerPopupVariants> & {
    portalContainer?: Element | null;
    backdrop?: boolean;
  }) {
  const inlined = portalContainer !== undefined;

  return (
    <BaseDrawer.Portal container={portalContainer}>
      {backdrop && (
        <BaseDrawer.Backdrop
          className={cn(
            'inset-0 min-h-dvh',
            inlined ? 'absolute' : 'fixed',
            inlined
              ? [
                  'bg-[rgb(0_0_0/calc(0.2*(1-var(--drawer-swipe-progress,0))))]',
                  '[backdrop-filter:blur(calc(4px*(1-var(--drawer-swipe-progress,0))))]',
                ]
              : [
                  'bg-[rgb(0_0_0/calc(0.6*(1-var(--drawer-swipe-progress,0))))]',
                  '[backdrop-filter:blur(calc(4px*(1-var(--drawer-swipe-progress,0))))]',
                ],
            'transition-[background-color,backdrop-filter] duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
            'data-[swiping]:duration-0',
            'data-[starting-style]:bg-transparent data-[starting-style]:[backdrop-filter:blur(0px)]',
            'data-[ending-style]:bg-transparent data-[ending-style]:[backdrop-filter:blur(0px)]',
            'data-[ending-style]:duration-[calc(var(--drawer-swipe-strength)*400ms)]',
          )}
        />
      )}
      <BaseDrawer.Viewport
        className={cn(
          'inset-0',
          inlined ? 'absolute' : 'fixed',
          direction === 'bottom' && 'flex items-end justify-center',
          !backdrop && 'pointer-events-none',
        )}
      >
        <BaseDrawer.Popup
          data-slot="drawer-popup"
          {...props}
          className={cn(
            'group/popup',
            !backdrop && 'pointer-events-auto',
            drawerPopupVariants({ direction }),
            className,
          )}
        >
          {children}
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}

export function DrawerHandle({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-handle"
      {...props}
      className={cn(
        'mx-auto mt-4 mb-0 h-1 w-12 rounded-full bg-muted/40 cursor-default',
        'transition-opacity duration-[200ms]',
        'group-data-[nested-drawer-open]/popup:opacity-0',
        'group-data-[nested-drawer-swiping]/popup:opacity-100',
        className,
      )}
    />
  );
}

export function DrawerHeader({
  className,
  children,
  ...props
}: React.ComponentProps<'header'>) {
  return (
    <header
      data-slot="drawer-header"
      {...props}
      className={cn('px-6 pt-4.5 flex items-center gap-3.5 cursor-default', className)}
    >
      {children}
    </header>
  );
}

export function DrawerTitle({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Title>) {
  return (
    <BaseDrawer.Title
      data-slot="drawer-title"
      {...props}
      className={cn('text-xl font-semibold', className)}
    >
      {children}
    </BaseDrawer.Title>
  );
}

export function DrawerBody({
  className,
  children,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <BaseDrawer.Content
      className={cn(
        'flex-1 min-h-0 overscroll-contain',
        'transition-opacity duration-[300ms] ease-[cubic-bezier(0.45,1.005,0,1.005)]',
        'group-data-[nested-drawer-open]/popup:opacity-0',
        'group-data-[nested-drawer-swiping]/popup:opacity-100',
      )}
    >
      <div
        data-slot="drawer-body"
        {...props}
        className={cn(
          'px-6 py-4.5 space-y-1.5 h-full overflow-y-auto',
          className,
        )}
      >
        {children}
      </div>
    </BaseDrawer.Content>
  );
}

export function DrawerDescription({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Description>) {
  return (
    <BaseDrawer.Description
      data-slot="drawer-description"
      {...props}
      className={cn('text-muted leading-relaxed', className)}
    >
      {children}
    </BaseDrawer.Description>
  );
}

export function DrawerFooter({
  className,
  children,
  ...props
}: React.ComponentProps<'footer'>) {
  return (
    <footer
      data-slot="drawer-footer"
      {...props}
      className={cn(
        'flex items-center justify-end gap-1.5 mt-auto',
        'px-6 py-3.5 bg-drawer-footer border-t border-drawer-border',
        className,
      )}
    >
      {children}
    </footer>
  );
}

export function DrawerClose({
  className,
  children,
  render,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Close>) {
  return (
    <BaseDrawer.Close
      data-slot="drawer-close"
      render={render}
      {...props}
      className={cn(!render && buttonVariants({ variant: 'plain' }), className)}
    >
      {children}
    </BaseDrawer.Close>
  );
}

export function DrawerSwipeArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.SwipeArea>) {
  return (
    <BaseDrawer.SwipeArea
      data-slot="drawer-swipe-area"
      {...props}
      className={className}
    >
      {children}
    </BaseDrawer.SwipeArea>
  );
}

export function DrawerProvider({
  ...props
}: React.ComponentProps<typeof BaseDrawer.Provider>) {
  return <BaseDrawer.Provider data-slot="drawer-provider" {...props} />;
}

export function DrawerIndent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.Indent>) {
  return (
    <BaseDrawer.Indent
      data-slot="drawer-indent"
      {...props}
      className={cn(
        'relative bg-background text-foreground',
        'will-change-transform origin-[center_top]',
        '[--indent-progress:var(--drawer-swipe-progress)]',
        '[--indent-radius:calc(1rem*(1-var(--indent-progress)))]',
        '[--indent-transition:calc(1-clamp(0,calc(var(--drawer-swipe-progress)*100000),1))]',
        '[transition:transform_0.4s_cubic-bezier(0.32,0.72,0,1),border-radius_0.25s_cubic-bezier(0.32,0.72,0,1)]',
        '[transition-duration:calc(400ms*var(--indent-transition)),calc(250ms*var(--indent-transition))]',
        '[transform:scale(1)_translateY(0)]',
        'data-[active]:[transform:scale(calc(0.98+(0.02*var(--indent-progress))))_translateY(calc(0.5rem*(1-var(--indent-progress))))]',
        'data-[active]:[border-top-left-radius:var(--indent-radius)]',
        'data-[active]:[border-top-right-radius:var(--indent-radius)]',
        className,
      )}
    >
      {children}
    </BaseDrawer.Indent>
  );
}

export function DrawerIndentBackground({
  className,
  children,
  ...props
}: React.ComponentProps<typeof BaseDrawer.IndentBackground>) {
  return (
    <BaseDrawer.IndentBackground
      data-slot="drawer-indent-background"
      {...props}
      className={cn('absolute inset-0 bg-black dark:bg-foreground', className)}
    >
      {children}
    </BaseDrawer.IndentBackground>
  );
}

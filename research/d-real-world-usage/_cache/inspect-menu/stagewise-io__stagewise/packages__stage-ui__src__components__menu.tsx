import { Menu as MenuBase } from '@base-ui/react/menu';
import type { ComponentProps, ReactElement } from 'react';
import { cn } from '../lib/utils';
import { ChevronRightIcon } from 'lucide-react';

export type MenuSize = 'xs' | 'sm' | 'md';

const menuSizes = {
  popup: {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
  } satisfies Record<MenuSize, string>,
  item: {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-2 py-1.5 text-sm',
    md: 'px-2.5 py-2 text-sm',
  } satisfies Record<MenuSize, string>,
};

export const Menu = MenuBase.Root;

export type MenuTriggerProps = Omit<
  ComponentProps<typeof MenuBase.Trigger>,
  'render' | 'className'
> & {
  children: React.ReactElement;
};
export function MenuTrigger({ children, ...props }: MenuTriggerProps) {
  return (
    <MenuBase.Trigger
      {...props}
      /* We do this because it works just fine but for some reason the types bitch around... */
      render={children as unknown as () => ReactElement}
    />
  );
}

export type MenuContentProps = Omit<
  ComponentProps<typeof MenuBase.Positioner> &
    ComponentProps<typeof MenuBase.Popup>,
  'render'
> & {
  children: React.ReactNode;
  size?: MenuSize;
};
export function MenuContent({
  align = 'center',
  alignOffset,
  side,
  sideOffset = 8,
  sticky,
  className,
  children,
  size = 'sm',
  ...props
}: MenuContentProps) {
  return (
    <MenuBase.Portal>
      <MenuBase.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        sticky={sticky}
        className="z-50"
      >
        <MenuBase.Popup
          {...props}
          className={cn(
            'flex origin-(--transform-origin) flex-col items-stretch gap-0.5',
            'rounded-lg border border-border-subtle bg-background p-1',
            'shadow-lg',
            'transition-[transform,scale,opacity] duration-150 ease-out',
            'data-ending-style:scale-90 data-starting-style:scale-90',
            'data-ending-style:opacity-0 data-starting-style:opacity-0',
            menuSizes.popup[size],
            className,
          )}
        >
          {children}
        </MenuBase.Popup>
      </MenuBase.Positioner>
    </MenuBase.Portal>
  );
}

export type MenuItemProps = ComponentProps<typeof MenuBase.Item> & {
  size?: MenuSize;
};
export function MenuItem({
  children,
  className,
  size = 'sm',
  ...props
}: MenuItemProps) {
  return (
    <MenuBase.Item
      {...props}
      className={cn(
        'flex w-full min-w-24 cursor-default flex-row items-center justify-start gap-2',
        'rounded-md text-foreground outline-none',
        'transition-colors duration-150 ease-out',
        'hover:bg-surface-1 data-highlighted:bg-surface-1',
        menuSizes.item[size],
        className,
      )}
    >
      {children}
    </MenuBase.Item>
  );
}

export const MenuSeparator = ({
  className,
  ...props
}: ComponentProps<typeof MenuBase.Separator>) => (
  <MenuBase.Separator
    {...props}
    className={(state) =>
      cn(
        'my-0.5 bg-border-subtle',
        state.orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )
    }
  />
);

export const MenuGroup = MenuBase.Group;
export const MenuGroupLabel = MenuBase.GroupLabel;
export const MenuRadioGroup = MenuBase.RadioGroup;
export const MenuRadioItem = MenuBase.RadioItem;
export const MenuCheckboxItem = MenuBase.CheckboxItem;
export const MenuSubmenu = MenuBase.SubmenuRoot;

export type MenuSubmenuTriggerProps = ComponentProps<
  typeof MenuBase.SubmenuTrigger
> & {
  size?: MenuSize;
};
export function MenuSubmenuTrigger({
  children,
  className,
  size = 'sm',
  ...props
}: MenuSubmenuTriggerProps) {
  return (
    <MenuBase.SubmenuTrigger
      {...props}
      className={cn(
        'group flex w-full min-w-24 cursor-default flex-row items-center justify-between gap-2',
        'rounded-md text-foreground outline-none',
        'transition-colors duration-150 ease-out',
        'hover:bg-surface-1 data-highlighted:bg-surface-1',
        menuSizes.item[size],
        className,
      )}
    >
      <span className="flex flex-row items-center gap-2">{children}</span>
      <ChevronRightIcon className="size-3 shrink-0 text-muted-foreground" />
    </MenuBase.SubmenuTrigger>
  );
}

export type MenuSubmenuContentProps = MenuContentProps;
export function MenuSubmenuContent({
  align = 'center',
  alignOffset,
  side,
  sideOffset = 0,
  sticky,
  className,
  children,
  size = 'sm',
  ...props
}: MenuSubmenuContentProps) {
  return (
    <MenuContent
      {...props}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      sticky={sticky}
      size={size}
      className={className}
    >
      {children}
    </MenuContent>
  );
}

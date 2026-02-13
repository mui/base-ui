import { Menu as BaseMenu } from '@base-ui/react/menu';
import clsx from 'clsx';

export const Root = BaseMenu.Root;
export const Portal = BaseMenu.Portal;

export function Trigger({ className, ...props }: BaseMenu.Trigger.Props) {
  return <BaseMenu.Trigger className={clsx('GhostButton', className)} {...props} />;
}

export function Positioner({ className, sideOffset = 8, ...props }: BaseMenu.Positioner.Props) {
  return (
    <BaseMenu.Positioner
      sideOffset={sideOffset}
      className={clsx('MenuPositioner', className)}
      {...props}
    />
  );
}

export function Popup({ children, className, ...props }: BaseMenu.Popup.Props) {
  return (
    <BaseMenu.Popup className={clsx('MenuPopup', className)} {...props}>
      {children}
    </BaseMenu.Popup>
  );
}

export function Item({ children, className, ...props }: BaseMenu.Item.Props) {
  return (
    <BaseMenu.Item className={clsx('MenuItem', className)} {...props}>
      {children}
    </BaseMenu.Item>
  );
}

export function LinkItem({ children, className, ...props }: BaseMenu.LinkItem.Props) {
  return (
    <BaseMenu.LinkItem className={clsx('MenuItem', className)} {...props}>
      {children}
    </BaseMenu.LinkItem>
  );
}

export function Separator({ className, ...props }: BaseMenu.Separator.Props) {
  return <BaseMenu.Separator className={clsx('MenuSeparator', className)} {...props} />;
}

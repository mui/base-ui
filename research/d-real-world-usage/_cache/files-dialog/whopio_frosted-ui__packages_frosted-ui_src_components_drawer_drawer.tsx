'use client';

import { DialogRootActions, Dialog as DrawerPrimitive } from '@base-ui/react/dialog';
import classNames from 'classnames';
import * as React from 'react';
import { Theme } from '../../theme';
import { Heading } from '../heading';

// Re-export createHandle for detached triggers
const createHandle = DrawerPrimitive.createHandle;

// Types from Base UI
type RootProps = React.ComponentProps<typeof DrawerPrimitive.Root>;
type PortalProps = React.ComponentProps<typeof DrawerPrimitive.Portal>;
type PopupProps = React.ComponentProps<typeof DrawerPrimitive.Popup>;

// Handle type - extracts the return type of createHandle with a generic
type DrawerHandle<T = unknown> = ReturnType<typeof DrawerPrimitive.createHandle<T>>;

// Root - generic to infer payload type from handle
interface DrawerRootProps<T = unknown> extends Omit<RootProps, 'modal' | 'children' | 'handle'> {
  children?: React.ReactNode | ((props: { payload: T | undefined }) => React.ReactNode);
  handle?: DrawerHandle<T>;
}
function DrawerRoot<T = unknown>(props: DrawerRootProps<T>) {
  return <DrawerPrimitive.Root {...(props as RootProps)} modal />;
}
DrawerRoot.displayName = 'DrawerRoot';

// Trigger - generic to infer payload type from handle
interface DrawerTriggerProps<T = unknown> extends Omit<
  React.ComponentProps<typeof DrawerPrimitive.Trigger>,
  'render' | 'handle' | 'payload'
> {
  className?: string;
  children: React.ReactElement;
  handle?: DrawerHandle<T>;
  payload?: T;
}
function DrawerTrigger<T = unknown>({ children, ...props }: DrawerTriggerProps<T>) {
  return (
    <DrawerPrimitive.Trigger
      {...(props as React.ComponentProps<typeof DrawerPrimitive.Trigger>)}
      render={children as React.ReactElement}
    />
  );
}
DrawerTrigger.displayName = 'DrawerTrigger';

// Content
interface DrawerContentProps extends Omit<PopupProps, 'className' | 'render' | 'style'> {
  className?: string;
  style?: React.CSSProperties;
  container?: PortalProps['container'];
  keepMounted?: PortalProps['keepMounted'];
}

const DrawerContent = (props: DrawerContentProps) => {
  const { className, children, keepMounted, container, ...popupProps } = props;

  // Stop keyboard events from propagating to parent floating UI components (e.g., DropdownMenu).
  // This prevents the menu's typeahead from capturing keystrokes when typing in drawer inputs.
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <DrawerPrimitive.Portal container={container} keepMounted={keepMounted}>
      <DrawerPrimitive.Backdrop className="fui-DialogBackdrop fui-DrawerBackdrop" />
      <DrawerPrimitive.Viewport className="fui-DrawerOverlay" onKeyDown={handleKeyDown}>
        <Theme
          render={<DrawerPrimitive.Popup />}
          {...popupProps}
          aria-describedby={undefined}
          className={classNames('fui-DrawerContent', className)}
        >
          {children}
        </Theme>
      </DrawerPrimitive.Viewport>
    </DrawerPrimitive.Portal>
  );
};
DrawerContent.displayName = 'DrawerContent';

// Title
type DrawerTitleProps = React.ComponentProps<typeof Heading>;
const DrawerTitle = (props: DrawerTitleProps) => (
  <DrawerPrimitive.Title render={<Heading size="4" weight="semi-bold" {...props} />} />
);
DrawerTitle.displayName = 'DrawerTitle';

// Close
interface DrawerCloseProps extends Omit<React.ComponentProps<typeof DrawerPrimitive.Close>, 'render'> {
  className?: string;
  children: React.ReactElement;
}
const DrawerClose = ({ children, ...props }: DrawerCloseProps) => (
  <DrawerPrimitive.Close {...props} render={children as React.ReactElement} />
);
DrawerClose.displayName = 'DrawerClose';

// Sticky Footer
type DrawerStickyFooterProps = React.ComponentProps<'div'>;
const DrawerStickyFooter = ({ children, className, ...props }: DrawerStickyFooterProps) => (
  <div className={classNames('fui-DrawerStickyFooter', className)} {...props}>
    {children}
  </div>
);
DrawerStickyFooter.displayName = 'DrawerStickyFooter';

// Header
type DrawerHeaderProps = React.ComponentProps<'div'>;
const DrawerHeader = ({ children, className, ...props }: DrawerHeaderProps) => (
  <div className={classNames('fui-DrawerHeader', className)} {...props}>
    {children}
  </div>
);
DrawerHeader.displayName = 'DrawerHeader';

// Body
type DrawerBodyProps = React.ComponentProps<'div'>;
const DrawerBody = ({ children, className, ...props }: DrawerBodyProps) => {
  const localRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  return (
    <div className="fui-BodyScrollArea" {...props} ref={localRef}>
      <div className={classNames('fui-DrawerBody', className)} ref={contentRef}>
        {children}
      </div>
    </div>
  );
};
DrawerBody.displayName = 'DrawerBody';

export {
  DrawerBody as Body,
  DrawerClose as Close,
  DrawerContent as Content,
  createHandle,
  DrawerHeader as Header,
  DrawerRoot as Root,
  DrawerStickyFooter as StickyFooter,
  DrawerTitle as Title,
  DrawerTrigger as Trigger,
};

export type {
  DialogRootActions as Actions,
  DrawerBodyProps as BodyProps,
  DrawerCloseProps as CloseProps,
  DrawerContentProps as ContentProps,
  DrawerHandle as Handle,
  DrawerHeaderProps as HeaderProps,
  DrawerRootProps as RootProps,
  DrawerStickyFooterProps as StickyFooterProps,
  DrawerTitleProps as TitleProps,
  DrawerTriggerProps as TriggerProps,
};

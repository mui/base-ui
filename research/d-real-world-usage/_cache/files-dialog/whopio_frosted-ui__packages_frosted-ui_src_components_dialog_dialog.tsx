'use client';

import { Dialog as DialogPrimitive, DialogRootActions } from '@base-ui/react/dialog';
import classNames from 'classnames';
import * as React from 'react';
import { Theme } from '../../theme';
import { Heading } from '../heading';
import { Text } from '../text';
import { dialogContentPropDefs } from './dialog.props';

import type { GetPropDefTypes } from '../../helpers';
import type { TextProps } from '../text';

// Re-export createHandle for detached triggers
const createHandle = DialogPrimitive.createHandle;

// Types from Base UI
type RootProps = React.ComponentProps<typeof DialogPrimitive.Root>;
type PortalProps = React.ComponentProps<typeof DialogPrimitive.Portal>;
type PopupProps = React.ComponentProps<typeof DialogPrimitive.Popup>;

// Handle type - extracts the return type of createHandle with a generic
type DialogHandle<T = unknown> = ReturnType<typeof DialogPrimitive.createHandle<T>>;

// Root - generic to infer payload type from handle
interface DialogRootProps<T = unknown> extends Omit<RootProps, 'modal' | 'children' | 'handle'> {
  children?: React.ReactNode | ((props: { payload: T | undefined }) => React.ReactNode);
  handle?: DialogHandle<T>;
}
function DialogRoot<T = unknown>(props: DialogRootProps<T>) {
  return <DialogPrimitive.Root {...(props as RootProps)} modal />;
}
DialogRoot.displayName = 'DialogRoot';

// Trigger - generic to infer payload type from handle
interface DialogTriggerProps<T = unknown> extends Omit<
  React.ComponentProps<typeof DialogPrimitive.Trigger>,
  'render' | 'handle' | 'payload'
> {
  className?: string;
  children: React.ReactElement;
  handle?: DialogHandle<T>;
  payload?: T;
}
function DialogTrigger<T = unknown>({ children, ...props }: DialogTriggerProps<T>) {
  return (
    <DialogPrimitive.Trigger
      {...(props as React.ComponentProps<typeof DialogPrimitive.Trigger>)}
      render={children as React.ReactElement}
    />
  );
}
DialogTrigger.displayName = 'DialogTrigger';

// Content
type DialogContentOwnProps = GetPropDefTypes<typeof dialogContentPropDefs>;

type DialogContentContextValue = { size: DialogContentOwnProps['size'] };
const DialogContentContext = React.createContext<DialogContentContextValue>({
  size: dialogContentPropDefs.size.default,
});

interface DialogContentProps extends Omit<PopupProps, 'className' | 'render' | 'style'>, DialogContentOwnProps {
  className?: string;
  style?: React.CSSProperties;
  container?: PortalProps['container'];
  keepMounted?: PortalProps['keepMounted'];
}

const DialogContent = (props: DialogContentProps) => {
  const {
    className,
    children,
    keepMounted,
    container,
    size = dialogContentPropDefs.size.default,
    ...popupProps
  } = props;

  // Stop keyboard events from propagating to parent floating UI components (e.g., DropdownMenu).
  // This prevents the menu's typeahead from capturing keystrokes when typing in dialog inputs.
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    event.stopPropagation();
  }, []);

  return (
    <DialogPrimitive.Portal container={container} keepMounted={keepMounted}>
      <DialogPrimitive.Backdrop className="fui-DialogBackdrop" />
      <DialogPrimitive.Viewport className="fui-DialogOverlay" onKeyDown={handleKeyDown}>
        <Theme
          render={<DialogPrimitive.Popup />}
          {...popupProps}
          className={classNames('fui-DialogContent', className, `fui-r-size-${size}`)}
        >
          <DialogContentContext.Provider value={React.useMemo(() => ({ size }), [size])}>
            {children}
          </DialogContentContext.Provider>
        </Theme>
      </DialogPrimitive.Viewport>
    </DialogPrimitive.Portal>
  );
};
DialogContent.displayName = 'DialogContent';

// Title
type DialogTitleProps = React.ComponentProps<typeof Heading>;

const DialogTitle = ({ size: sizeProp, className, ...props }: DialogTitleProps) => {
  const { size: contextSize } = React.useContext(DialogContentContext);
  let size: DialogTitleProps['size'];

  if (contextSize) {
    size = (
      {
        '1': '3',
        '2': '5',
        '3': '5',
        '4': '6',
      } as const
    )[contextSize];
  }

  return (
    <DialogPrimitive.Title
      render={
        <Heading size={sizeProp || size} trim="start" className={classNames('fui-DialogTitle', className)} {...props} />
      }
    />
  );
};
DialogTitle.displayName = 'DialogTitle';

// Description
type DialogDescriptionProps = TextProps;

const DialogDescription = ({ size: sizeProp, className, ...props }: DialogDescriptionProps) => {
  const { size: contextSize } = React.useContext(DialogContentContext);
  let size: DialogDescriptionProps['size'];

  if (contextSize) {
    size = (
      {
        '1': '1',
        '2': '2',
        '3': '2',
        '4': '3',
      } as const
    )[contextSize];
  }

  return (
    <DialogPrimitive.Description
      render={
        <Text
          render={<p />}
          size={sizeProp || size}
          className={classNames('fui-DialogDescription', className)}
          {...props}
        />
      }
    />
  );
};
DialogDescription.displayName = 'DialogDescription';

// Close
interface DialogCloseProps extends Omit<React.ComponentProps<typeof DialogPrimitive.Close>, 'render'> {
  className?: string;
  children: React.ReactElement;
}
const DialogClose = ({ children, ...props }: DialogCloseProps) => (
  <DialogPrimitive.Close {...props} render={children as React.ReactElement} />
);
DialogClose.displayName = 'DialogClose';

export {
  DialogClose as Close,
  DialogContent as Content,
  createHandle,
  DialogDescription as Description,
  DialogRoot as Root,
  DialogTitle as Title,
  DialogTrigger as Trigger,
};

export type {
  DialogRootActions as Actions,
  DialogCloseProps as CloseProps,
  DialogContentProps as ContentProps,
  DialogDescriptionProps as DescriptionProps,
  DialogHandle as Handle,
  DialogRootProps as RootProps,
  DialogTitleProps as TitleProps,
  DialogTriggerProps as TriggerProps,
};

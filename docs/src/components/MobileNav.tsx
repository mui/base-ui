'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import clsx from 'clsx';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Drawer } from '@base-ui/react/drawer';
import { MobileNavContext } from './MobileNavContext';
import './MobileNav.css';

const LazyDrawer = React.lazy(() =>
  import('./MobileNavDrawer').then((module) => ({ default: module.MobileNavDrawer })),
);

interface RootProps extends Omit<Drawer.Root.Props, 'children' | 'handle'> {
  children?: React.ReactNode;
  triggerClassName?: string;
  trigger: React.ReactNode;
  triggerProps?: Omit<Drawer.Trigger.Props, 'children' | 'handle'>;
  enableKeyboardShortcut?: boolean;
  keyboardShortcutMediaQuery?: string;
}

export function Root({
  children,
  trigger,
  triggerClassName,
  triggerProps,
  enableKeyboardShortcut = false,
  keyboardShortcutMediaQuery,
  onOpenChange,
  ...props
}: RootProps) {
  const [handle] = React.useState(() => Drawer.createHandle());
  const generatedTriggerId = React.useId();
  const [searchValue, setSearchValue] = React.useState('');
  const triggerId = triggerProps?.id ?? generatedTriggerId;

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean, eventDetails: Drawer.Root.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (!nextOpen) {
        setSearchValue('');
      }
    },
    [onOpenChange],
  );

  React.useEffect(() => {
    if (!enableKeyboardShortcut) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (keyboardShortcutMediaQuery && !window.matchMedia(keyboardShortcutMediaQuery).matches) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        if (!handle.isOpen) {
          handle.open(triggerId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [enableKeyboardShortcut, handle, keyboardShortcutMediaQuery, triggerId]);

  const contextValue = React.useMemo(
    () => ({ handle, searchValue, setSearchValue }),
    [handle, searchValue],
  );

  return (
    <MobileNavContext.Provider value={contextValue}>
      <Drawer.Trigger
        {...triggerProps}
        id={triggerId}
        handle={handle}
        className={clsx(triggerClassName, triggerProps?.className)}
      >
        {trigger}
      </Drawer.Trigger>
      <React.Suspense fallback={null}>
        <LazyDrawer handle={handle} onOpenChange={handleOpenChange} {...props}>
          {children}
        </LazyDrawer>
      </React.Suspense>
    </MobileNavContext.Provider>
  );
}

export function Section(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('MobileNavSection', props.className)} />;
}

export function Heading(props: React.ComponentProps<'div'>) {
  return <div {...props} className={clsx('MobileNavHeading', props.className)} />;
}

export function List(props: React.ComponentProps<'ul'>) {
  return <ul {...props} className={clsx('MobileNavList', props.className)} />;
}

export function Badge(props: React.ComponentProps<'span'>) {
  return <span {...props} className={clsx('MobileNavBadge', props.className)} />;
}

interface ItemProps extends React.ComponentPropsWithoutRef<'li'> {
  active?: boolean;
  href: string;
  rel?: string;
  external?: boolean;
}

export function Item({ href, external, ...props }: ItemProps) {
  const { handle } = React.useContext(MobileNavContext);
  const pathname = usePathname();
  const active = props.active ?? pathname === href;

  const LinkComponent = external ? 'a' : NextLink;

  return (
    <li {...props} className={clsx('MobileNavItem', props.className)}>
      <LinkComponent
        aria-current={active ? 'page' : undefined}
        data-active={active ? '' : undefined}
        className="MobileNavLink"
        href={href}
        rel={props.rel}
        // We handle scroll manually
        scroll={external ? undefined : false}
        onClick={() => {
          if (href === window.location.pathname) {
            // If the URL is the same, close, wait a little, and scroll to top smoothly
            handle?.close();
            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 500);
          } else {
            // Otherwise, wait for the URL change before closing and scroll up instantly
            onUrlChange(() => {
              ReactDOM.flushSync(() => handle?.close());
              window.scrollTo({ top: 0, behavior: 'instant' });
            });
          }
        }}
      >
        {props.children}
      </LinkComponent>
    </li>
  );
}

function onUrlChange(callback: () => void) {
  const initialUrl = window.location.href;

  function rafRecursively() {
    requestAnimationFrame(() => {
      if (initialUrl === window.location.href) {
        rafRecursively();
      } else {
        callback();
      }
    });
  }

  rafRecursively();
}

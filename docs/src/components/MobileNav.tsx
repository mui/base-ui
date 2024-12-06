'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { Dialog } from '@base-ui-components/react/dialog';
import { HEADER_HEIGHT } from './Header';

type MobileNavState = [boolean, (open: boolean) => void];
const MobileNavState = React.createContext<MobileNavState>([false, () => undefined]);

export function Root(props: Dialog.Root.Props) {
  const state = React.useState(false);
  const [open, setOpen] = state;

  return (
    <MobileNavState.Provider value={state}>
      <Dialog.Root open={open} onOpenChange={setOpen} {...props} />
    </MobileNavState.Provider>
  );
}

export const Trigger = Dialog.Trigger;

export function Backdrop({ className, ...props }: Dialog.Backdrop.Props) {
  return <Dialog.Backdrop className={clsx('MobileNavBackdrop', className)} {...props} />;
}

export function Popup({ children, className, ...props }: Dialog.Popup.Props) {
  const [, setOpen] = React.useContext(MobileNavState);
  const rem = React.useRef(16);

  React.useEffect(() => {
    rem.current = parseFloat(getComputedStyle(document.documentElement).fontSize);
  }, []);

  return (
    <Dialog.Popup className={clsx('MobileNavPopup', className)} {...props}>
      <div className="MobileNavBottomOverscroll" />
      <div
        className="MobileNavViewport"
        onScroll={(event) => {
          const viewport = event.currentTarget;
          if (viewport.scrollTop > (HEADER_HEIGHT * rem.current) / 16) {
            viewport.setAttribute('data-clipped', '');
          } else {
            viewport.removeAttribute('data-clipped');
          }
        }}
        onTouchStart={(event) => {
          const viewport = event.currentTarget;

          // Consider flicks from scroll top only (iOS does the same with its sheets)
          if (viewport.scrollTop <= 0) {
            viewport.addEventListener(
              'touchend',
              function handleTouchEnd() {
                // If touch ended and we are overscrolling past a threshold...
                if (viewport.scrollTop < -32) {
                  const y = viewport.scrollTop;
                  viewport.addEventListener(
                    'scroll',
                    function handleNextScroll() {
                      // ...look at whether the system's intertia scrolling is continuing the motion
                      // in the same direction. If so, the flick is strong enough to close the dialog.
                      if (viewport.scrollTop < y) {
                        // It's gonna eventually bounce back to scrollTop 0. We need to counteract this
                        // a bit so that the close transition doesn't appear slower than it should.
                        viewport.style.translate = `0px -${y}px`;
                        viewport.style.transform = `400ms`;
                        setOpen(false);

                        // Sometimes the first scroll event comes with the same scroll position
                        // If so, give it another chance, call ourselves recursively
                      } else if (viewport.scrollTop === y) {
                        viewport.addEventListener('scroll', handleNextScroll, { once: true });
                      }
                    },
                    { once: true },
                  );
                }
              },
              { once: true },
            );
          }
        }}
      >
        <div className="MobileNavViewportInner">
          {/* We need the area behind the panel to close on tap but also to scroll the viewport. */}
          <Dialog.Close className="MobileNavBackdropTapArea" tabIndex={-1} render={<div />} />

          <nav className="MobileNavPanel">
            {/* Reverse order to place the close button at the end of the DOM, but at sticky top visually */}
            <div className="flex flex-col-reverse">
              <div>{children}</div>
              <div className="MobileNavCloseContainer">
                <Dialog.Close aria-label="Close the navigation" className="MobileNavClose">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0.75 0.75L6 6M11.25 11.25L6 6M6 6L0.75 11.25M6 6L11.25 0.75"
                      stroke="currentcolor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Dialog.Close>
              </div>
            </div>
          </nav>
        </div>
      </div>
    </Dialog.Popup>
  );
}

export function Section({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={clsx('MobileNavSection', className)} {...props} />;
}

export function Heading({ children, className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={clsx('MobileNavHeading', className)} {...props}>
      <div className="MobileNavHeadingInner">{children}</div>
    </div>
  );
}

export function List({ className, ...props }: React.ComponentProps<'ul'>) {
  return <ul className={clsx('MobileNavList', className)} {...props} />;
}

interface ItemProps extends React.ComponentPropsWithoutRef<'li'> {
  active?: boolean;
  href: string;
  rel?: string;
}

export function Item({ active, children, className, href, rel, ...props }: ItemProps) {
  const [, setOpen] = React.useContext(MobileNavState);
  return (
    <li className={clsx('MobileNavItem', className)} {...props}>
      <NextLink
        aria-current={active ? 'page' : undefined}
        className="MobileNavLink"
        href={href}
        rel={rel}
        onClick={() => setOpen(false)}
      >
        {children}
      </NextLink>
    </li>
  );
}

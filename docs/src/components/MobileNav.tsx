'use client';
import * as React from 'react';
import clsx from 'clsx';
import NextLink from 'next/link';
import { Dialog } from '@base-ui-components/react/dialog';
import { useMediaQuery } from '@base-ui-components/react/use-media-query';

type MobileNavState = [boolean, (open: boolean) => void];
const MobileNavState = React.createContext<MobileNavState>([false, () => undefined]);

export function Root(props: Dialog.Root.Props) {
  const state = React.useState(false);
  const [open, setOpen] = state;

  // @media (--show-side-nav)
  // const showSideNav = useMediaQuery('@media (width >= 64rem)', { noSsr: true });
  // React.useEffect(() => {
  //   if (showSideNav) {
  //     setOpen(false);
  //   }
  // }, [setOpen, showSideNav]);

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
  // const [open, setOpen] = React.useContext(MobileNavState);
  return (
    <Dialog.Popup className={clsx('MobileNavPopup', className)} {...props}>
      <div className="MobileNavViewport">
        <div className="MobileNavViewportInner">
          <Dialog.Close className="MobileNavBackdropTapArea" tabIndex={-1} render={<div />} />
          <nav aria-label="Main navigation" className="MobileNavPanel">
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
}

export function Item({ children, className, href, ...props }: ItemProps) {
  return (
    <li className={clsx('MobileNavItem', className)} {...props}>
      <NextLink className="MobileNavLink" href={href}>
        {children}
      </NextLink>
    </li>
  );
}

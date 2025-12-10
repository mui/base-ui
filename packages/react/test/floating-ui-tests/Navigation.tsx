import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import {
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFocus,
  useHover,
  useInteractions,
} from '../../src/floating-ui-react';

interface SubItemProps {
  label: string;
  href: string;
}

/** @internal */
export const NavigationSubItem = React.forwardRef<
  HTMLAnchorElement,
  SubItemProps & React.HTMLProps<HTMLAnchorElement>
>(function NavigationSubItem({ label, href, ...props }, ref) {
  return (
    <a {...props} ref={ref} href={href} className="NavigationItem">
      {label}
    </a>
  );
});

interface ItemProps {
  label: string;
  href: string;
  children?: React.ReactNode;
}

/** @internal */
export const NavigationItem = React.forwardRef<
  HTMLAnchorElement,
  ItemProps & React.HTMLProps<HTMLAnchorElement>
>(function NavigationItem({ children, label, href, ...props }, ref) {
  const [open, setOpen] = React.useState(false);
  const hasChildren = !!children;

  const nodeId = useFloatingNodeId();

  const { floatingStyles, refs, context } = useFloating({
    open,
    nodeId,
    onOpenChange: setOpen,
    middleware: [offset(8), flip(), shift()],
    placement: 'right-start',
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, {
      handleClose: safePolygon(),
      enabled: hasChildren,
    }),
    useFocus(context, {
      enabled: hasChildren,
    }),
    useDismiss(context, {
      enabled: hasChildren,
    }),
  ]);

  const mergedReferenceRef = useMergedRefs(ref, refs.setReference);

  return (
    <FloatingNode id={nodeId}>
      <li>
        <a
          href={href}
          ref={mergedReferenceRef}
          className="bg-slate-100 my-1 flex w-48 items-center justify-between rounded p-2"
          {...getReferenceProps(props)}
        >
          {label}
        </a>
      </li>
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} modal={false} initialFocus={false}>
            <div
              data-testid="subnavigation"
              ref={refs.setFloating}
              className="bg-slate-100 flex flex-col overflow-y-auto rounded px-4 py-2 backdrop-blur-sm outline-none"
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
              <ul className="flex flex-col">{children}</ul>
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </FloatingNode>
  );
});

interface NavigationProps {
  children?: React.ReactNode;
}

/** @internal */
export function Navigation(props: NavigationProps) {
  return (
    <nav className="Navigation">
      <ul className="NavigationList">{props.children}</ul>
    </nav>
  );
}

/** @internal */
export function Main() {
  return (
    <React.Fragment>
      <h1 className="mb-8 text-5xl font-bold">Navigation</h1>
      <div className="border-slate-400 mb-4 grid h-[20rem] place-items-center rounded border lg:w-[40rem]">
        <Navigation>
          <NavigationItem label="Home" href="#" />
          <NavigationItem label="Product" href="#">
            <NavigationSubItem label="Link 1" href="#" />
            <NavigationSubItem label="Link 2" href="#" />
            <NavigationSubItem label="Link 3" href="#" />
          </NavigationItem>
          <NavigationItem label="About" href="#" />
        </Navigation>
      </div>
    </React.Fragment>
  );
}

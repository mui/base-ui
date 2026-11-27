'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useTestInteractions } from '#test-utils';
import { flip, offset, shift } from '@floating-ui/react-dom';
import { getEmptyRootStore } from '../../src/utils/popups/floating-root/getEmptyRootStore';
import { FloatingFocusManager } from '../../src/utils/popups/focus/FloatingFocusManager';
import { PopupTreeNode, usePopupNodeId } from '../../src/utils/popups/tree/PopupTree';
import { FloatingPortal } from '../../src/utils/popups/portal/FloatingPortal';
import { safePolygon } from '../../src/utils/popups/interactions/safePolygon';
import { useHoverPopupInteraction } from '../../src/utils/popups/interactions/useHoverPopupInteraction';
import { useHoverTriggerInteraction } from '../../src/utils/popups/interactions/useHoverTriggerInteraction';
import { useDismiss } from '../../src/utils/popups/interactions/useDismiss';
import { useFocus } from '../../src/utils/popups/interactions/useFocus';
import { useFloating } from './useFloating';
import styles from './Navigation.module.css';

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
    <a {...props} ref={ref} href={href} className={styles.SubItem}>
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
  const fallbackStore = React.useMemo(() => getEmptyRootStore(), []);

  const nodeId = usePopupNodeId();

  const { floatingStyles, refs, context } = useFloating({
    open,
    nodeId,
    onOpenChange: setOpen,
    middleware: [offset(8), flip(), shift()],
    placement: 'right-start',
  });

  const hoverStore = hasChildren ? context.rootStore : fallbackStore;
  const hoverReferenceProps = useHoverTriggerInteraction(hoverStore, {
    handleClose: safePolygon(),
    triggerElementRef: hasChildren ? refs.domReference : undefined,
  });
  useHoverPopupInteraction(hoverStore);

  const { getReferenceProps, getFloatingProps } = useTestInteractions([
    { reference: hoverReferenceProps },
    useFocus(context.rootStore, {
      enabled: hasChildren,
    }),
    useDismiss(context.rootStore, {
      enabled: hasChildren,
    }),
  ]);

  const mergedReferenceRef = useMergedRefs(ref, refs.setReference);

  return (
    <PopupTreeNode id={nodeId}>
      <li>
        <a
          href={href}
          ref={mergedReferenceRef}
          className={styles.Item}
          {...getReferenceProps(props)}
        >
          {label}
        </a>
      </li>
      <FloatingPortal>
        {open && (
          <FloatingFocusManager store={context.rootStore} modal={false} initialFocus={false}>
            <div
              data-testid="subnavigation"
              ref={refs.setFloating}
              className={styles.Subnav}
              style={floatingStyles}
              {...getFloatingProps()}
            >
              <button type="button" onClick={() => setOpen(false)}>
                Close
              </button>
              <ul className={styles.SubnavList}>{children}</ul>
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </PopupTreeNode>
  );
});

interface NavigationProps {
  children?: React.ReactNode;
}

/** @internal */
export function Navigation(props: NavigationProps) {
  return (
    <nav>
      <ul>{props.children}</ul>
    </nav>
  );
}

/** @internal */
export function Main() {
  return (
    <React.Fragment>
      <h1 className={styles.Heading}>Navigation</h1>
      <div className={styles.Container}>
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

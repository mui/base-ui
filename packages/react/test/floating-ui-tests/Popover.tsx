/* eslint-disable @typescript-eslint/no-shadow */
'use client';
import * as React from 'react';
import { getEmptyRootContext } from '../../src/floating-ui-react/utils/getEmptyRootContext';
import type { Placement } from '../../src/floating-ui-react/types';
import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  FloatingTree,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useHover,
  useInteractions,
  useRole,
} from '../../src/floating-ui-react';
import styles from './Popover.module.css';

/** @internal */
export function Main() {
  return (
    <React.Fragment>
      <h1 className={styles.Heading}>Popover</h1>
      <div className={styles.Container}>
        <Popover
          modal
          bubbles
          render={({ labelId, descriptionId, close }) => (
            <React.Fragment>
              <h2 id={labelId} className={styles.Title}>
                Title
              </h2>
              <p id={descriptionId} className={styles.Description}>
                Description
              </p>
              <Popover
                modal
                bubbles
                render={({ labelId, descriptionId, close }) => (
                  <React.Fragment>
                    <h2 id={labelId} className={styles.Title}>
                      Title
                    </h2>
                    <p id={descriptionId} className={styles.Description}>
                      Description
                    </p>
                    <Popover
                      modal
                      bubbles={false}
                      render={({ labelId, descriptionId, close }) => (
                        <React.Fragment>
                          <h2 id={labelId} className={styles.Title}>
                            Title
                          </h2>
                          <p id={descriptionId} className={styles.Description}>
                            Description
                          </p>
                          <button type="button" onClick={close} className={styles.CloseButton}>
                            Close
                          </button>
                        </React.Fragment>
                      )}
                    >
                      <button type="button">My button</button>
                    </Popover>
                    <button type="button" onClick={close} className={styles.CloseButton}>
                      Close
                    </button>
                  </React.Fragment>
                )}
              >
                <button type="button">My button</button>
              </Popover>
              <button type="button" onClick={close} className={styles.CloseButton}>
                Close
              </button>
            </React.Fragment>
          )}
        >
          <button type="button">My button</button>
        </Popover>
      </div>
    </React.Fragment>
  );
}
interface Props {
  render: (data: { close: () => void; labelId: string; descriptionId: string }) => React.ReactNode;
  placement?: Placement;
  modal?: boolean;
  children?: React.ReactElement<HTMLElement>;
  bubbles?: boolean;
  hover?: boolean;
}

/** @internal */
function PopoverComponent({
  children,
  render,
  placement,
  modal = true,
  bubbles = true,
  hover = false,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const nodeId = useFloatingNodeId();
  const { floatingStyles, refs, context } = useFloating({
    nodeId,
    open,
    placement,
    onOpenChange: setOpen,
    middleware: [offset(10), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const id = React.useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const fallbackContext = React.useMemo(() => getEmptyRootContext(), []);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(hover ? context : fallbackContext, {
      handleClose: safePolygon({ blockPointerEvents: true }),
    }),
    useClick(context),
    useRole(context),
    useDismiss(context, {
      bubbles,
    }),
  ]);

  return (
    <FloatingNode id={nodeId}>
      {React.isValidElement(children) &&
        React.cloneElement(
          children,
          getReferenceProps({
            ref: refs.setReference,
            'data-open': open ? '' : undefined,
          } as React.HTMLProps<Element>),
        )}
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} modal={modal}>
            <div
              className={styles.Floating}
              ref={refs.setFloating}
              style={floatingStyles}
              aria-labelledby={labelId}
              aria-describedby={descriptionId}
              {...getFloatingProps()}
            >
              {render({
                labelId,
                descriptionId,
                close: () => setOpen(false),
              })}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </FloatingNode>
  );
}

/** @internal */
export function Popover(props: Props) {
  const parentId = useFloatingParentNodeId();

  // This is a root, so we wrap it with the tree
  if (parentId === null) {
    return (
      <FloatingTree>
        <PopoverComponent {...props} />
      </FloatingTree>
    );
  }

  return <PopoverComponent {...props} />;
}

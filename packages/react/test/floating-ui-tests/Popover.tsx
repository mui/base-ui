/* eslint-disable @typescript-eslint/no-shadow */
import * as React from 'react';
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

/** @internal */
export function Main() {
  return (
    <React.Fragment>
      <h1 className="mb-8 text-5xl font-bold">Popover</h1>
      <div className="border-slate-400 mb-4 grid h-[20rem] place-items-center rounded border lg:w-[40rem]">
        <Popover
          modal
          bubbles
          render={({ labelId, descriptionId, close }) => (
            <React.Fragment>
              <h2 id={labelId} className="mb-2 text-2xl font-bold">
                Title
              </h2>
              <p id={descriptionId} className="mb-2">
                Description
              </p>
              <Popover
                modal
                bubbles
                render={({ labelId, descriptionId, close }) => (
                  <React.Fragment>
                    <h2 id={labelId} className="mb-2 text-2xl font-bold">
                      Title
                    </h2>
                    <p id={descriptionId} className="mb-2">
                      Description
                    </p>
                    <Popover
                      modal
                      bubbles={false}
                      render={({ labelId, descriptionId, close }) => (
                        <React.Fragment>
                          <h2 id={labelId} className="mb-2 text-2xl font-bold">
                            Title
                          </h2>
                          <p id={descriptionId} className="mb-2">
                            Description
                          </p>
                          <button type="button" onClick={close} className="font-bold">
                            Close
                          </button>
                        </React.Fragment>
                      )}
                    >
                      <button type="button">My button</button>
                    </Popover>
                    <button type="button" onClick={close} className="font-bold">
                      Close
                    </button>
                  </React.Fragment>
                )}
              >
                <button type="button">My button</button>
              </Popover>
              <button type="button" onClick={close} className="font-bold">
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

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, {
      enabled: hover,
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
              className="border-slate-900/10 rounded border bg-white bg-clip-padding px-4 py-6 shadow-md"
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

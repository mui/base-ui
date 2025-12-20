/* eslint-disable @typescript-eslint/no-shadow */
import { act, fireEvent, flushMicrotasks, render, screen, waitFor } from '@mui/internal-test-utils';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { vi } from 'vitest';

import { isJSDOM } from '@base-ui/utils/detectBrowser';
import {
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  FloatingTree,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFloatingParentNodeId,
  useFocus,
  useInteractions,
  useClick,
} from '../index';
import { REASONS } from '../../utils/reasons';
import type { UseDismissProps } from './useDismiss';
import { normalizeProp } from './useDismiss';

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(
    (callback: FrameRequestCallback): number => {
      callback(0);
      return 0;
    },
  );
});

function App(
  props: UseDismissProps & {
    onClose?: () => void;
  },
) {
  const [open, setOpen] = React.useState(true);
  const { refs, context } = useFloating({
    open,
    onOpenChange(openArg, data) {
      setOpen(openArg);
      const reason = data?.reason;
      if (props.outsidePress) {
        expect(reason).toBe(REASONS.outsidePress);
      } else if (props.escapeKey) {
        expect(reason).toBe(REASONS.escapeKey);
        if (!openArg) {
          props.onClose?.();
        }
      } else if (props.referencePress) {
        expect(reason).toBe(REASONS.triggerPress);
      } else if (props.ancestorScroll) {
        expect(reason).toBe(REASONS.none);
      }
    },
  });
  const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context, props)]);

  return (
    <React.Fragment>
      <button {...getReferenceProps({ ref: refs.setReference })} />
      {open && (
        <div role="tooltip" {...getFloatingProps({ ref: refs.setFloating })}>
          <input />
        </div>
      )}
    </React.Fragment>
  );
}

describe.skipIf(!isJSDOM)('useDismiss', () => {
  describe('true', () => {
    test('dismisses with escape key', async () => {
      render(<App />);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      await flushMicrotasks();
    });

    test('does not dismiss with escape key if IME is active', async () => {
      const onClose = vi.fn();

      render(<App onClose={onClose} escapeKey />);

      const textbox = screen.getByRole('textbox');

      await act(async () => {
        textbox.focus();
      });

      await flushMicrotasks();

      // Simulate behavior when "あ" (Japanese) is entered and Esc is pressed for IME
      // cancellation.
      fireEvent.change(textbox, { target: { value: 'あ' } });
      fireEvent.compositionStart(textbox);
      fireEvent.keyDown(textbox, { key: 'Escape' });
      fireEvent.compositionEnd(textbox);

      // Wait for the compositionend timeout tick due to Safari
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });

      expect(onClose).toHaveBeenCalledTimes(0);

      fireEvent.keyDown(textbox, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('dismisses with outside pointer press', async () => {
      render(<App />);
      await userEvent.click(document.body);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    test('dismisses with reference press', async () => {
      render(<App referencePress />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    test('dismisses with native click', async () => {
      render(<App referencePress />);
      fireEvent.click(screen.getByRole('button'));
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    test('dismisses with ancestor scroll', async () => {
      render(<App ancestorScroll />);
      fireEvent.scroll(window);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
      await flushMicrotasks();
    });

    test('outsidePress function guard', async () => {
      render(<App outsidePress={() => false} />);
      await userEvent.click(document.body);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    test('outsidePress ignored for third party elements', async () => {
      function App() {
        const [isOpen, setIsOpen] = React.useState(true);

        const { context, refs } = useFloating({
          open: isOpen,
          onOpenChange: setIsOpen,
        });

        const dismiss = useDismiss(context);

        const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

        return (
          <React.Fragment>
            <button {...getReferenceProps({ ref: refs.setReference })} />
            {isOpen && (
              <FloatingFocusManager context={context}>
                <div role="dialog" {...getFloatingProps({ ref: refs.setFloating })} />
              </FloatingFocusManager>
            )}
          </React.Fragment>
        );
      }

      render(<App />);
      await flushMicrotasks();

      const thirdParty = document.createElement('div');
      thirdParty.setAttribute('data-testid', 'third-party');
      document.body.append(thirdParty);
      await userEvent.click(thirdParty);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      thirdParty.remove();
    });

    test('outsidePress not ignored for nested floating elements', async () => {
      function Popover({
        children,
        id,
        modal,
      }: {
        children?: React.ReactNode;
        id: string;
        modal?: boolean | null;
      }) {
        const [isOpen, setIsOpen] = React.useState(true);

        const { context, refs } = useFloating({
          open: isOpen,
          onOpenChange: setIsOpen,
        });

        const dismiss = useDismiss(context);

        const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

        const dialogJsx = (
          <div role="dialog" data-testid={id} {...getFloatingProps({ ref: refs.setFloating })}>
            {children}
          </div>
        );

        return (
          <React.Fragment>
            <button {...getReferenceProps({ ref: refs.setReference })} />
            {isOpen && (
              <React.Fragment>
                {modal == null ? (
                  dialogJsx
                ) : (
                  <FloatingFocusManager context={context} modal={modal}>
                    {dialogJsx}
                  </FloatingFocusManager>
                )}
              </React.Fragment>
            )}
          </React.Fragment>
        );
      }

      function App({ modal }: { modal: [boolean, boolean] | null }) {
        return (
          <Popover id="popover-1" modal={modal ? modal[0] : true}>
            <Popover id="popover-2" modal={modal ? modal[1] : null} />
          </Popover>
        );
      }

      const { unmount } = render(<App modal={[true, true]} />);
      await flushMicrotasks();

      let popover1 = screen.getByTestId('popover-1');
      let popover2 = screen.getByTestId('popover-2');
      await userEvent.click(popover2);
      expect(popover1).toBeInTheDocument();
      expect(popover2).toBeInTheDocument();
      await userEvent.click(popover1);
      expect(popover2).not.toBeInTheDocument();

      unmount();

      const { unmount: unmount2 } = render(<App modal={[true, false]} />);
      await flushMicrotasks();

      popover1 = screen.getByTestId('popover-1');
      popover2 = screen.getByTestId('popover-2');

      await userEvent.click(popover2);
      expect(popover1).toBeInTheDocument();
      expect(popover2).toBeInTheDocument();
      await userEvent.click(popover1);
      expect(popover2).not.toBeInTheDocument();

      unmount2();

      const { unmount: unmount3 } = render(<App modal={[false, true]} />);
      await flushMicrotasks();

      popover1 = screen.getByTestId('popover-1');
      popover2 = screen.getByTestId('popover-2');

      await userEvent.click(popover2);
      expect(popover1).toBeInTheDocument();
      expect(popover2).toBeInTheDocument();
      await userEvent.click(popover1);
      expect(popover2).not.toBeInTheDocument();

      unmount3();

      render(<App modal={null} />);
      await flushMicrotasks();

      popover1 = screen.getByTestId('popover-1');
      popover2 = screen.getByTestId('popover-2');

      await userEvent.click(popover2);
      expect(popover1).toBeInTheDocument();
      expect(popover2).toBeInTheDocument();
      await userEvent.click(popover1);
      expect(popover2).not.toBeInTheDocument();
    });
  });

  describe('false', () => {
    test('dismisses with escape key', async () => {
      render(<App escapeKey={false} />);
      fireEvent.keyDown(document.body, { key: 'Escape' });
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      await flushMicrotasks();
    });

    test('dismisses with outside press', async () => {
      render(<App outsidePress={false} />);
      await userEvent.click(document.body);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    test('dismisses with reference pointer down', async () => {
      render(<App referencePress={false} />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
    });

    test('dismisses with ancestor scroll', async () => {
      render(<App ancestorScroll={false} />);
      fireEvent.scroll(window);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      await flushMicrotasks();
    });

    test('does not dismiss when clicking portaled children', async () => {
      function App() {
        const [open, setOpen] = React.useState(true);
        const { refs, context } = useFloating({
          open,
          onOpenChange: setOpen,
        });

        const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context)]);

        return (
          <React.Fragment>
            <button ref={refs.setReference} {...getReferenceProps()} />
            {open && (
              <div ref={refs.setFloating} {...getFloatingProps()}>
                <FloatingPortal>
                  <button data-testid="portaled-button" />
                </FloatingPortal>
              </div>
            )}
          </React.Fragment>
        );
      }

      render(<App />);

      fireEvent.pointerDown(screen.getByTestId('portaled-button'), {
        bubbles: true,
      });
      await flushMicrotasks();

      expect(screen.getByTestId('portaled-button')).toBeInTheDocument();
    });

    test('outsidePress function guard', async () => {
      render(<App outsidePress={() => true} />);
      await userEvent.click(document.body);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  describe('bubbles', () => {
    function Dialog({
      testId,
      children,
      ...props
    }: UseDismissProps & { testId: string; children: React.ReactNode }) {
      const [open, setOpen] = React.useState(true);
      const nodeId = useFloatingNodeId();

      const { refs, context } = useFloating({
        open,
        onOpenChange: setOpen,
        nodeId,
      });

      const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context, props)]);

      return (
        <FloatingNode id={nodeId}>
          <button {...getReferenceProps({ ref: refs.setReference })} />
          {open && (
            <FloatingFocusManager context={context}>
              <div {...getFloatingProps({ ref: refs.setFloating })} data-testid={testId}>
                {children}
              </div>
            </FloatingFocusManager>
          )}
        </FloatingNode>
      );
    }

    function NestedDialog(props: UseDismissProps & { testId: string; children: React.ReactNode }) {
      const parentId = useFloatingParentNodeId();

      if (parentId == null) {
        return (
          <FloatingTree>
            <Dialog {...props} />
          </FloatingTree>
        );
      }

      return <Dialog {...props} />;
    }

    describe('prop resolution', () => {
      test('undefined', () => {
        const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp();

        expect(escapeKeyBubbles).toBe(false);
        expect(outsidePressBubbles).toBe(true);
      });

      test('false', () => {
        const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } =
          normalizeProp(false);

        expect(escapeKeyBubbles).toBe(false);
        expect(outsidePressBubbles).toBe(false);
      });

      test('{}', () => {
        const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp(
          {},
        );

        expect(escapeKeyBubbles).toBe(false);
        expect(outsidePressBubbles).toBe(true);
      });

      test('{ escapeKey: false }', () => {
        const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp({
          escapeKey: false,
        });

        expect(escapeKeyBubbles).toBe(false);
        expect(outsidePressBubbles).toBe(true);
      });

      test('{ outsidePress: false }', () => {
        const { escapeKey: escapeKeyBubbles, outsidePress: outsidePressBubbles } = normalizeProp({
          outsidePress: false,
        });

        expect(escapeKeyBubbles).toBe(false);
        expect(outsidePressBubbles).toBe(false);
      });
    });

    describe('outsidePress', () => {
      test('true', async () => {
        render(
          <NestedDialog testId="outer">
            <NestedDialog testId="inner">
              <button>test button</button>
            </NestedDialog>
          </NestedDialog>,
        );

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();

        fireEvent.pointerDown(document.body);

        expect(screen.queryByTestId('outer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      });

      test('false', async () => {
        render(
          <NestedDialog testId="outer" bubbles={{ outsidePress: false }}>
            <NestedDialog testId="inner" bubbles={{ outsidePress: false }}>
              <button>test button</button>
            </NestedDialog>
          </NestedDialog>,
        );

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();

        fireEvent.pointerDown(document.body);

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();

        fireEvent.pointerDown(document.body);

        expect(screen.queryByTestId('outer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      });

      test('mixed', async () => {
        render(
          <NestedDialog testId="outer" bubbles={{ outsidePress: true }}>
            <NestedDialog testId="inner" bubbles={{ outsidePress: false }}>
              <button>test button</button>
            </NestedDialog>
          </NestedDialog>,
        );

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();

        fireEvent.pointerDown(document.body);

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();

        fireEvent.pointerDown(document.body);

        expect(screen.queryByTestId('outer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      });
    });

    describe('escapeKey', () => {
      test('without FloatingTree', async () => {
        function App() {
          const [popoverOpen, setPopoverOpen] = React.useState(true);
          const [tooltipOpen, setTooltipOpen] = React.useState(false);

          const popover = useFloating({
            open: popoverOpen,
            onOpenChange: setPopoverOpen,
          });
          const tooltip = useFloating({
            open: tooltipOpen,
            onOpenChange: setTooltipOpen,
          });

          const popoverInteractions = useInteractions([useDismiss(popover.context)]);
          const tooltipInteractions = useInteractions([
            useFocus(tooltip.context, { visibleOnly: false }),
            useDismiss(tooltip.context),
          ]);

          return (
            <React.Fragment>
              <button
                ref={popover.refs.setReference}
                {...popoverInteractions.getReferenceProps()}
              />
              {popoverOpen && (
                <div
                  role="dialog"
                  ref={popover.refs.setFloating}
                  {...popoverInteractions.getFloatingProps()}
                >
                  <button
                    data-testid="focus-button"
                    ref={tooltip.refs.setReference}
                    {...tooltipInteractions.getReferenceProps()}
                  />
                </div>
              )}
              {tooltipOpen && (
                <div
                  role="tooltip"
                  ref={tooltip.refs.setFloating}
                  {...tooltipInteractions.getFloatingProps()}
                />
              )}
            </React.Fragment>
          );
        }

        render(<App />);

        await flushMicrotasks();
        await act(async () => {
          screen.getByTestId('focus-button').focus();
        });

        await waitFor(() => {
          expect(screen.getByRole('tooltip')).toBeInTheDocument();
        });

        await userEvent.keyboard('{Escape}');

        await waitFor(() => {
          expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
        });
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      test('true', async () => {
        render(
          <NestedDialog testId="outer" bubbles>
            <NestedDialog testId="inner" bubbles>
              <button>test button</button>
            </NestedDialog>
          </NestedDialog>,
        );

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(screen.queryByTestId('outer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      });

      test('false', async () => {
        render(
          <NestedDialog testId="outer" bubbles={{ escapeKey: false }}>
            <NestedDialog testId="inner" bubbles={{ escapeKey: false }}>
              <button>test button</button>
            </NestedDialog>
          </NestedDialog>,
        );

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(screen.queryByTestId('outer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      });

      test('mixed', async () => {
        render(
          <NestedDialog testId="outer" bubbles={{ escapeKey: true }}>
            <NestedDialog testId="inner" bubbles={{ escapeKey: false }}>
              <button>test button</button>
            </NestedDialog>
          </NestedDialog>,
        );

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.getByTestId('inner')).toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(screen.getByTestId('outer')).toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();

        await userEvent.keyboard('{Escape}');

        expect(screen.queryByTestId('outer')).not.toBeInTheDocument();
        expect(screen.queryByTestId('inner')).not.toBeInTheDocument();
      });
    });
  });

  describe('capture', () => {
    describe('prop resolution', () => {
      test('undefined', () => {
        const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } = normalizeProp();

        expect(escapeKeyCapture).toBe(false);
        expect(outsidePressCapture).toBe(true);
      });

      test('{}', () => {
        const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } = normalizeProp(
          {},
        );

        expect(escapeKeyCapture).toBe(false);
        expect(outsidePressCapture).toBe(true);
      });

      test('true', () => {
        const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } =
          normalizeProp(true);

        expect(escapeKeyCapture).toBe(true);
        expect(outsidePressCapture).toBe(true);
      });

      test('false', () => {
        const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } =
          normalizeProp(false);

        expect(escapeKeyCapture).toBe(false);
        expect(outsidePressCapture).toBe(false);
      });

      test('{ escapeKey: true }', () => {
        const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } = normalizeProp({
          escapeKey: true,
        });

        expect(escapeKeyCapture).toBe(true);
        expect(outsidePressCapture).toBe(true);
      });

      test('{ outsidePress: false }', () => {
        const { escapeKey: escapeKeyCapture, outsidePress: outsidePressCapture } = normalizeProp({
          outsidePress: false,
        });

        expect(escapeKeyCapture).toBe(false);
        expect(outsidePressCapture).toBe(false);
      });
    });

    function Overlay({ children }: { children: React.ReactNode }) {
      return (
        <div
          style={{ width: '100vw', height: '100vh' }}
          onPointerDown={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
            }
          }}
        >
          <span>outside</span>
          {children}
        </div>
      );
    }

    function Dialog({
      id,
      children,
      ...props
    }: UseDismissProps & { id: string; children: React.ReactNode }) {
      const [open, setOpen] = React.useState(true);
      const nodeId = useFloatingNodeId();

      const { refs, context } = useFloating({
        open,
        onOpenChange: setOpen,
        nodeId,
      });

      const { getReferenceProps, getFloatingProps } = useInteractions([useDismiss(context, props)]);

      return (
        <FloatingNode id={nodeId}>
          <button {...getReferenceProps({ ref: refs.setReference })} />
          {open && (
            <FloatingPortal>
              <FloatingFocusManager context={context}>
                <div {...getFloatingProps({ ref: refs.setFloating })}>
                  <span>{id}</span>
                  {children}
                </div>
              </FloatingFocusManager>
            </FloatingPortal>
          )}
        </FloatingNode>
      );
    }

    function NestedDialog(props: UseDismissProps & { id: string; children: React.ReactNode }) {
      const parentId = useFloatingParentNodeId();

      if (parentId == null) {
        return (
          <FloatingTree>
            <Dialog {...props} />
          </FloatingTree>
        );
      }

      return <Dialog {...props} />;
    }

    describe('outsidePress', () => {
      test('true', async () => {
        const user = userEvent.setup();

        render(
          <Overlay>
            <NestedDialog id="outer">
              <NestedDialog id="inner">{null}</NestedDialog>
            </NestedDialog>
          </Overlay>,
        );

        expect(screen.getByText('outer')).toBeInTheDocument();
        expect(screen.getByText('inner')).toBeInTheDocument();

        await user.click(screen.getByText('outer'));

        expect(screen.getByText('outer')).toBeInTheDocument();
        expect(screen.queryByText('inner')).not.toBeInTheDocument();

        await user.click(screen.getByText('outside'));

        expect(screen.queryByText('outer')).not.toBeInTheDocument();
        expect(screen.queryByText('inner')).not.toBeInTheDocument();
      });
    });

    describe('escapeKey', () => {
      test('false', async () => {
        const user = userEvent.setup();

        render(
          <Overlay>
            <NestedDialog id="outer">
              <NestedDialog id="inner">{null}</NestedDialog>
            </NestedDialog>
          </Overlay>,
        );

        expect(screen.getByText('outer')).toBeInTheDocument();
        expect(screen.getByText('inner')).toBeInTheDocument();

        await user.keyboard('{Escape}');

        expect(screen.getByText('outer')).toBeInTheDocument();
        expect(screen.queryByText('inner')).not.toBeInTheDocument();

        await user.keyboard('{Escape}');

        expect(screen.queryByText('outer')).not.toBeInTheDocument();
        expect(screen.queryByText('inner')).not.toBeInTheDocument();
      });
    });
  });

  describe('outsidePressEvent: intentional', () => {
    test('dragging outside the floating element does not close', async () => {
      render(<App outsidePressEvent="intentional" />);
      const floatingEl = screen.getByRole('tooltip');
      fireEvent.mouseDown(floatingEl);
      fireEvent.mouseUp(document.body);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      await flushMicrotasks();
    });

    test('dragging inside the floating element does not close', async () => {
      render(<App outsidePressEvent="intentional" />);
      const floatingEl = screen.getByRole('tooltip');
      fireEvent.mouseDown(document.body);
      fireEvent.mouseUp(floatingEl);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();
      await flushMicrotasks();
    });

    test('dragging outside the floating element then clicking outside closes', async () => {
      render(<App outsidePressEvent="intentional" />);
      const floatingEl = screen.getByRole('tooltip');
      fireEvent.mouseDown(floatingEl);
      fireEvent.mouseUp(document.body);
      // A click event will have fired before the proper outside click.
      fireEvent.click(document.body);
      fireEvent.click(document.body);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  test('nested floating elements with different portal containers', async () => {
    function ButtonWithFloating({
      children,
      portalContainer,
      triggerText,
    }: {
      children?: React.ReactNode;
      portalContainer?: HTMLElement | null;
      triggerText: string;
    }) {
      const [open, setOpen] = React.useState(false);
      const { refs, floatingStyles, context } = useFloating({
        open,
        onOpenChange: setOpen,
      });

      const click = useClick(context);
      const dismiss = useDismiss(context);

      const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss]);

      return (
        <React.Fragment>
          <button ref={refs.setReference} {...getReferenceProps()}>
            {triggerText}
          </button>
          {open && (
            <FloatingPortal container={portalContainer}>
              <FloatingFocusManager context={context} modal={false}>
                <div ref={refs.setFloating} style={floatingStyles} {...getFloatingProps()}>
                  {children}
                </div>
              </FloatingFocusManager>
            </FloatingPortal>
          )}
        </React.Fragment>
      );
    }

    function App() {
      const [otherContainer, setOtherContainer] = React.useState<HTMLDivElement | null>();

      const portal1 = undefined;
      const portal2 = otherContainer;

      return (
        <React.Fragment>
          <ButtonWithFloating portalContainer={portal1} triggerText="open 1">
            <ButtonWithFloating portalContainer={portal2} triggerText="open 2">
              <button>nested</button>
            </ButtonWithFloating>
          </ButtonWithFloating>
          <div ref={setOtherContainer} />
        </React.Fragment>
      );
    }

    render(<App />);

    await userEvent.click(screen.getByText('open 1'));
    expect(screen.getByText('open 2')).toBeInTheDocument();

    await userEvent.click(screen.getByText('open 2'));
    await flushMicrotasks();

    expect(screen.getByText('open 1')).toBeInTheDocument();
    expect(screen.getByText('open 2')).toBeInTheDocument();
    expect(screen.getByText('nested')).toBeInTheDocument();
  });
});

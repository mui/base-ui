import * as React from 'react';
import { describe, expect, test } from 'vitest';
import { screen, fireEvent, waitFor, act } from '@mui/internal-test-utils';
import { createRenderer } from '#test-utils';
import { Dialog } from '../../../dialog';
import { Popover } from '../../../popover';
import { Combobox } from '../../../combobox';

function Modal({
  name,
  children,
  container,
}: {
  name: string;
  children?: React.ReactNode;
  container?: HTMLElement;
}) {
  return (
    <Dialog.Root defaultOpen>
      <Dialog.Trigger>{name} trigger</Dialog.Trigger>
      <Dialog.Portal container={container}>
        <Dialog.Backdrop />
        <Dialog.Popup>
          <Dialog.Title>{name}</Dialog.Title>
          <button>{name} first</button>
          {children}
          <Dialog.Close>{name} close</Dialog.Close>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// These contracts depend on browser focus and native inert, not just attributes.
describe.runIf('inert' in HTMLElement.prototype)('modal outside exclusion', () => {
  const { render } = createRenderer();
  test.each([{ mode: 'open' }, { mode: 'closed' }] as const)(
    'contains focus within an owning $mode shadow root',
    async ({ mode }) => {
      const host = document.createElement('div');
      const root = host.attachShadow({ mode });
      const outside = document.createElement('button');
      root.append(outside);
      document.body.append(host);
      const chosen = React.createRef<HTMLButtonElement>();
      let initialFocusEvents = 0;
      const late = document.createElement('button');
      const { unmount } = await render(
        <Dialog.Root defaultOpen>
          <Dialog.Portal container={root}>
            <Dialog.Popup initialFocus={chosen}>
              <Dialog.Title>Shadow modal</Dialog.Title>
              <button>First action</button>
              <button
                ref={chosen}
                onFocus={() => {
                  initialFocusEvents += 1;
                }}
              >
                Chosen action
              </button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
      try {
        // Document activation must not replace the requested initial control.
        let activationHandled = false;
        const handleActivation = () => {
          activationHandled = true;
        };
        document.addEventListener('focus', handleActivation);
        try {
          document.dispatchEvent(new FocusEvent('focus'));
        } finally {
          document.removeEventListener('focus', handleActivation);
        }
        expect(activationHandled).toBe(true);
        await waitFor(() => expect(root.activeElement).toBe(chosen.current));
        expect(initialFocusEvents).toBeGreaterThan(0);
        outside.focus();
        expect(root.activeElement).toBe(chosen.current);
        root.append(late);
        late.focus();
        expect(root.activeElement).toBe(chosen.current);
      } finally {
        unmount();
        host.remove();
      }
      expect(outside.hasAttribute('inert')).toBe(false);
      expect(late.hasAttribute('inert')).toBe(false);
    },
  );

  test.each([{ mode: 'open' }, { mode: 'closed' }] as const)(
    'preserves parent modal content beside a nonmodal child in an internal $mode root',
    async ({ mode }) => {
      const parentAction = document.createElement('button');
      parentAction.textContent = 'Parent shadow action';
      let root: ShadowRoot;
      function ShadowChild() {
        const [container, setContainer] = React.useState<ShadowRoot | null>(null);
        const attach = React.useCallback((host: HTMLDivElement | null) => {
          if (host && !root) {
            root = host.attachShadow({ mode });
            root.append(parentAction);
            setContainer(root);
          }
        }, []);
        return (
          <React.Fragment>
            <div ref={attach} />
            <Popover.Root>
              <Popover.Trigger>Open shadow child</Popover.Trigger>
              {container && (
                <Popover.Portal container={container}>
                  <Popover.Positioner>
                    <Popover.Popup>
                      <button>Child action</button>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              )}
            </Popover.Root>
          </React.Fragment>
        );
      }
      const { unmount } = await render(
        <Modal name="parent">
          <ShadowChild />
        </Modal>,
      );
      try {
        await waitFor(() => expect(document.activeElement).toBe(screen.getByText('parent first')));
        parentAction.focus();
        expect(root!.activeElement).toBe(parentAction);
        fireEvent.click(screen.getByText('Open shadow child'));
        await waitFor(() => expect(root!.activeElement?.textContent).toBe('Child action'));
        expect(parentAction.hasAttribute('inert')).toBe(false);
        parentAction.focus();
        expect(root!.activeElement).toBe(parentAction);
      } finally {
        unmount();
      }
      expect(parentAction.hasAttribute('inert')).toBe(false);
    },
  );

  test.each([{ policy: 'false' }, { policy: 'undefined' }, { policy: 'outside' }] as const)(
    'ends the initial-focus exception after entering the popup ($policy)',
    async ({ policy }) => {
      const outsideRef = React.createRef<HTMLButtonElement>();
      const policies = { false: false, undefined: () => undefined, outside: outsideRef };
      const { user } = await render(
        <React.Fragment>
          <button ref={outsideRef}>Outside target</button>
          <Dialog.Root>
            <Dialog.Trigger>Open</Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Popup initialFocus={policies[policy]}>
                <button>Inside action</button>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Fragment>,
      );
      const trigger = screen.getByText('Open');
      const initialTarget = policy === 'outside' ? outsideRef.current! : trigger;
      await user.click(trigger);
      await waitFor(() => expect(initialTarget).toHaveFocus());
      const inside = screen.getByText('Inside action');
      await user.click(inside);
      expect(inside).toHaveFocus();
      initialTarget.focus();
      expect(inside).toHaveFocus();
    },
  );

  test('does not exempt the document body when initial focus is disabled', async () => {
    expect(document.activeElement).toBe(document.body);
    await render(
      <React.Fragment>
        <button>Outside action</button>
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup initialFocus={false}>
              <button>Inside action</button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </React.Fragment>,
    );
    screen.getByText('Outside action').focus();
    expect(screen.getByText('Outside action')).not.toHaveFocus();
  });

  test.each([
    { name: 'open root, false', mode: 'open', initialFocus: false },
    { name: 'closed root, false', mode: 'closed', initialFocus: false },
    { name: 'open root, undefined callback', mode: 'open', initialFocus: () => undefined },
    { name: 'closed root, undefined callback', mode: 'closed', initialFocus: () => undefined },
  ] as const)('keeps only the opener exempt in $name', async ({ mode, initialFocus }) => {
    const host = document.createElement('div');
    const root = host.attachShadow({ mode });
    const container = document.createElement('div');
    const outside = document.createElement('button');
    root.append(container, outside);
    document.body.append(host);
    const opener = React.createRef<HTMLButtonElement>();
    const inside = React.createRef<HTMLButtonElement>();
    const { user, unmount } = await render(
      <Dialog.Root>
        <Dialog.Trigger ref={opener}>Open</Dialog.Trigger>
        <Dialog.Portal container={root}>
          <Dialog.Popup initialFocus={initialFocus}>
            <button ref={inside}>Inside</button>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
      { container },
    );
    try {
      await user.click(opener.current!);
      expect(root.activeElement).toBe(opener.current);
      expect(outside).toHaveAttribute('inert');
      outside.focus();
      expect(root.activeElement).toBe(opener.current);
      inside.current!.focus();
      expect(root.activeElement).toBe(inside.current);
      opener.current!.focus();
      expect(root.activeElement).toBe(inside.current);
    } finally {
      unmount();
      host.remove();
    }
    expect(outside).not.toHaveAttribute('inert');
  });

  test.each([{ modal: false }, { modal: true }])(
    'ends the outside exception on external child entry and restores parent focus (modal=$modal)',
    async ({ modal }) => {
      const outside = React.createRef<HTMLInputElement>();
      function Example({ childOpen = false }: { childOpen?: boolean }) {
        return (
          <React.Fragment>
            <input ref={outside} />
            <Dialog.Root>
              <Dialog.Trigger>Open parent</Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Popup initialFocus={outside}>
                  <Popover.Root open={childOpen} modal={modal}>
                    <Popover.Trigger>Child trigger</Popover.Trigger>
                    <Popover.Portal container={document.body}>
                      <Popover.Positioner>
                        <Popover.Popup>
                          <button>External child action</button>
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                  <Dialog.Close>Close parent</Dialog.Close>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </React.Fragment>
        );
      }
      const { user, rerender } = await render(<Example />);
      const trigger = screen.getByText('Open parent');
      await user.click(trigger);
      await waitFor(() => expect(outside.current).toHaveFocus());
      await rerender(<Example childOpen />);
      const childAction = screen.getByText('External child action');
      await waitFor(() => expect(childAction).toHaveFocus());
      outside.current!.focus();
      expect(childAction).toHaveFocus();
      await rerender(<Example />);
      await waitFor(() => expect(screen.getByText('Child trigger')).toHaveFocus());
      outside.current!.focus();
      expect(screen.getByText('Child trigger')).toHaveFocus();
      await user.click(screen.getByText('Close parent'));
      await waitFor(() => expect(trigger).toHaveFocus());
    },
  );

  test('returns to the parent popup when a programmatic child has no eligible invoker', async () => {
    const outside = document.createElement('input');
    document.body.append(outside);
    const childAction = React.createRef<HTMLButtonElement>();
    function Example({ childOpen }: { childOpen: boolean }) {
      return (
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup initialFocus={() => outside}>
              <Dialog.Title>Parent modal</Dialog.Title>
              <button>Parent action</button>
              <Dialog.Root open={childOpen}>
                <Dialog.Portal>
                  <Dialog.Popup initialFocus={childAction}>
                    <Dialog.Title>Child modal</Dialog.Title>
                    <button ref={childAction}>Child action</button>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }
    const { rerender, unmount } = await render(<Example childOpen={false} />);
    try {
      await waitFor(() => expect(document.activeElement).toBe(outside));
      await rerender(<Example childOpen />);
      await waitFor(() => expect(document.activeElement).toBe(childAction.current));
      await rerender(<Example childOpen={false} />);
      await waitFor(() => expect(document.activeElement).toBe(screen.getByText('Parent action')));
      outside.focus();
      expect(document.activeElement).toBe(screen.getByText('Parent action'));
    } finally {
      unmount();
      outside.remove();
    }
  });

  test('blocks existing and same-task inserted controls, including live regions', async () => {
    const { unmount } = await render(
      <React.Fragment>
        <div aria-live="polite">
          <button>outside</button>
        </div>
        <Modal name="modal" />
      </React.Fragment>,
    );
    await waitFor(() => expect(document.activeElement).toBe(screen.getByText('modal first')));
    screen.getByText('outside').focus();
    expect(document.activeElement).toBe(screen.getByText('modal first'));

    const late = document.createElement('button');
    let focused = false;
    late.addEventListener('focus', () => {
      focused = true;
    });
    document.body.append(late);
    try {
      late.focus();
      expect(document.activeElement).toBe(screen.getByText('modal first'));
      expect(focused).toBe(false);
    } finally {
      late.remove();
      unmount();
    }
  });

  test.each([
    { mode: 'document', staticTarget: false },
    { mode: 'open', staticTarget: false },
    { mode: 'closed', staticTarget: false },
    { mode: 'open', staticTarget: true },
    { mode: 'closed', staticTarget: true },
  ] as const)(
    'preserves external child focus in a $mode root (static=$staticTarget)',
    async ({ mode, staticTarget }) => {
      const host = document.createElement('div');
      document.body.append(host);
      const container = mode === 'document' ? document.body : host.attachShadow({ mode });
      const child = React.createRef<HTMLElement>();
      const getActiveElement = () =>
        mode === 'document' ? document.activeElement : (container as ShadowRoot).activeElement;
      const { user, unmount } = await render(
        <Modal name="parent">
          <Popover.Root>
            <Popover.Trigger>open child</Popover.Trigger>
            <Popover.Portal container={container}>
              <Popover.Positioner>
                <Popover.Popup initialFocus={staticTarget ? child : undefined}>
                  {staticTarget ? (
                    <h2
                      tabIndex={-1}
                      ref={(element) => {
                        child.current = element;
                      }}
                    >
                      child heading
                    </h2>
                  ) : (
                    <button
                      ref={(element) => {
                        child.current = element;
                      }}
                    >
                      child first
                    </button>
                  )}
                  <Popover.Close>child close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </Modal>,
      );
      const late = document.createElement('input');
      try {
        await waitFor(() => expect(document.activeElement).toBe(screen.getByText('parent first')));
        await user.click(screen.getByText('open child'));
        expect(child.current).not.toBeNull();
        const action = child.current!;
        await waitFor(() => expect(getActiveElement()).toBe(action));
        document.body.append(late);
        late.focus();
        expect(getActiveElement()).toBe(action);
        await act(async () => {
          await Promise.resolve();
        });
        expect(child.current).toBe(action);
        expect(getActiveElement()).toBe(action);
      } finally {
        late.remove();
        unmount();
        host.remove();
      }
    },
  );

  test('preserves boolean inert presence and its exact author value', async () => {
    const existing = document.createElement('div');
    existing.setAttribute('inert', 'false');
    document.body.append(existing);
    const { unmount } = await render(<Modal name="modal" />);
    try {
      await waitFor(() => expect(document.activeElement).toBe(screen.getByText('modal first')));
      fireEvent.click(screen.getByText('modal close'));
      await waitFor(() => expect(screen.queryByText('modal first')).toBe(null));
      expect(existing.getAttribute('inert')).toBe('false');
    } finally {
      unmount();
      existing.remove();
    }
  });

  test('gives an initially-open nested modal ownership before its parent commits', async () => {
    const { unmount } = await render(
      <React.StrictMode>
        <Modal name="parent">
          <Modal name="child" />
        </Modal>
      </React.StrictMode>,
    );
    try {
      await waitFor(() => expect(document.activeElement).toBe(screen.getByText('child first')));
      screen.getByText('parent first').focus();
      expect(document.activeElement).toBe(screen.getByText('child first'));
      fireEvent.click(screen.getByText('child close'));
      await waitFor(() => expect(document.activeElement).toBe(screen.getByText('child trigger')));
      screen.getByText('parent first').focus();
      expect(document.activeElement).toBe(screen.getByText('parent first'));
    } finally {
      unmount();
    }
  });

  test('does not promote an older modal when its portal container changes', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    function Example({ container }: { container?: HTMLElement }) {
      return (
        <React.Fragment>
          <Modal name="one" container={container} />
          <Modal name="two" />
        </React.Fragment>
      );
    }
    const { rerender, unmount } = await render(<Example />);
    try {
      await waitFor(() => expect(document.activeElement).toBe(screen.getByText('two first')));
      await rerender(<Example container={host} />);
      screen.getByText('one first').focus();
      expect(document.activeElement).toBe(screen.getByText('two first'));
    } finally {
      unmount();
      host.remove();
    }
  });

  test('keeps the last independent modal active across rerenders and restores the prior modal', async () => {
    function Example({ revision }: { revision: number }) {
      return (
        <div data-revision={revision}>
          <Modal name="one" />
          <Modal name="two" />
        </div>
      );
    }
    const { rerender, unmount } = await render(<Example revision={0} />);
    try {
      await waitFor(() => expect(document.activeElement).toBe(screen.getByText('two first')));
      await rerender(<Example revision={1} />);
      screen.getByText('one first').focus();
      expect(document.activeElement).toBe(screen.getByText('two first'));
      fireEvent.click(screen.getByText('two close'));
      await waitFor(() => expect(screen.queryByText('two first')).toBe(null));
      screen.getByText('one first').focus();
      expect(document.activeElement).toBe(screen.getByText('one first'));
    } finally {
      unmount();
    }
  });
  test.each([{ mode: 'open' }, { mode: 'closed' }] as const)(
    'keeps only an external $mode shadow opener exempt',
    async ({ mode }) => {
      const host = document.createElement('div');
      document.body.append(host);
      const root = host.attachShadow({ mode });
      const app = document.createElement('div');
      const outside = document.createElement('button');
      root.append(app, outside);
      const opener = React.createRef<HTMLButtonElement>();
      const { user, unmount } = await render(
        <Dialog.Root>
          <Dialog.Trigger ref={opener}>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup initialFocus={false}>
              <button>Inside</button>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
        { container: app },
      );
      try {
        await user.click(opener.current!);
        expect(root.activeElement).toBe(opener.current);
        outside.focus();
        expect(root.activeElement).toBe(opener.current);
      } finally {
        unmount();
        host.remove();
      }
    },
  );
  test.each([{ initial: false }, { initial: true }])(
    'admits a nonmodal nested Root rendered beside the parent Popup (initial=$initial)',
    async ({ initial }) => {
      const handle = Dialog.createHandle();
      const { user } = await render(
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup>
              <button>Parent action</button>
              <Dialog.Trigger handle={handle}>Open child</Dialog.Trigger>
              <Dialog.Close>Parent close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
          <Dialog.Root handle={handle} modal={false} defaultOpen={initial}>
            <Dialog.Portal>
              <Dialog.Popup>
                <button>Child action</button>
                <Dialog.Close>Child close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </Dialog.Root>,
      );
      if (!initial) {
        await user.click(screen.getByText('Open child'));
      }
      await waitFor(() => expect(screen.getByText('Child action')).toHaveFocus());
    },
  );
  test.each([
    { family: 'dialog', modal: false },
    { family: 'popover', modal: false },
  ] as const)(
    'keeps $family with a handle-linked trigger usable (modal=$modal)',
    async ({ family, modal }) => {
      const dialogHandle = Dialog.createHandle();
      const popoverHandle = Popover.createHandle();
      const child =
        family === 'dialog' ? (
          <Dialog.Root handle={dialogHandle} modal={modal}>
            <Dialog.Portal container={document.body}>
              <Dialog.Popup style={{ position: 'fixed', top: 260 }}>
                <button>Child action</button>
                <Dialog.Close>Child close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        ) : (
          <Popover.Root handle={popoverHandle} modal={modal}>
            <Popover.Portal container={document.body}>
              <Popover.Positioner>
                <Popover.Popup style={{ position: 'fixed', top: 260 }}>
                  <button>Child action</button>
                  <Popover.Close>Child close</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        );
      const { user } = await render(
        <React.Fragment>
          <Dialog.Root defaultOpen>
            <Dialog.Portal>
              <Dialog.Popup style={{ position: 'fixed', top: 140 }}>
                <button>Parent action</button>
                {family === 'dialog' ? (
                  <Dialog.Trigger handle={dialogHandle}>Open child</Dialog.Trigger>
                ) : (
                  <Popover.Trigger handle={popoverHandle}>Open child</Popover.Trigger>
                )}
                <Dialog.Close>Parent close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
          {child}
        </React.Fragment>,
      );
      await waitFor(() => expect(screen.getByText('Parent action')).toHaveFocus());
      await user.click(screen.getByText('Open child'));
      await waitFor(() => expect(screen.getByText('Child action')).toHaveFocus());
    },
  );
  test.each([{ triggerless: false }, { triggerless: true }])(
    'keeps a sibling child Root usable under a modal Combobox (triggerless=$triggerless)',
    async ({ triggerless }) => {
      const handle = Dialog.createHandle();
      function Example() {
        const [open, setOpen] = React.useState(false);
        return (
          <Dialog.Root defaultOpen>
            <Dialog.Portal>
              <Dialog.Popup style={{ position: 'fixed', top: 100 }}>
                <button>Parent action</button>
                <Combobox.Root defaultOpen modal items={['Apple']}>
                  <Combobox.Trigger>Combo trigger</Combobox.Trigger>
                  <Combobox.Portal>
                    <Combobox.Positioner>
                      <Combobox.Popup>
                        <Combobox.Input data-testid="combo-input" />
                        {triggerless ? (
                          <button onClick={() => setOpen(true)}>Open child</button>
                        ) : (
                          <Dialog.Trigger handle={handle}>Open child</Dialog.Trigger>
                        )}
                      </Combobox.Popup>
                    </Combobox.Positioner>
                  </Combobox.Portal>
                  <Dialog.Root
                    handle={triggerless ? undefined : handle}
                    open={triggerless ? open : undefined}
                    onOpenChange={triggerless ? setOpen : undefined}
                    modal={false}
                  >
                    <Dialog.Portal container={document.body}>
                      <Dialog.Popup style={{ position: 'fixed', top: 400 }}>
                        <button>Child action</button>
                        <Dialog.Close>Child close</Dialog.Close>
                      </Dialog.Popup>
                    </Dialog.Portal>
                  </Dialog.Root>
                </Combobox.Root>
                <Dialog.Close>Parent close</Dialog.Close>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        );
      }
      const { user } = await render(<Example />);
      await waitFor(() => expect(screen.getByTestId('combo-input')).toHaveFocus());
      await user.click(screen.getByText('Open child'));
      await waitFor(() => expect(screen.getByText('Child action')).toHaveFocus());
    },
  );

  test('excludes an unrelated already-open nonmodal popup', async () => {
    await render(
      <React.Fragment>
        <Popover.Root defaultOpen>
          <Popover.Trigger>Background trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <button>Background action</button>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup>
              <button>Foreground action</button>
              <Dialog.Close>Close</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </React.Fragment>,
    );
    await waitFor(() => expect(screen.getByText('Foreground action')).toHaveFocus());
    screen.getByText('Background action').focus();
    expect(screen.getByText('Foreground action')).toHaveFocus();
  });

  test('allows a shared handle to open from the newer independent modal', async () => {
    const childHandle = Popover.createHandle();
    const secondHandle = Dialog.createHandle();
    const { user } = await render(
      <React.Fragment>
        <Dialog.Root defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup style={{ position: 'fixed', top: 100 }}>
              <button>First action</button>
              <Popover.Trigger handle={childHandle}>Open from first</Popover.Trigger>
              <Dialog.Trigger handle={secondHandle}>Open second modal</Dialog.Trigger>
            </Dialog.Popup>
          </Dialog.Portal>
          <Popover.Root handle={childHandle}>
            <Popover.Portal container={document.body}>
              <Popover.Positioner>
                <Popover.Popup>
                  <button>Shared action</button>
                  <Popover.Close>Close shared</Popover.Close>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </Dialog.Root>
        <Dialog.Root handle={secondHandle}>
          <Dialog.Portal>
            <Dialog.Popup style={{ position: 'fixed', top: 260 }}>
              <button>Second action</button>
              <Popover.Trigger handle={childHandle}>Open from second</Popover.Trigger>
              <Dialog.Close>Close second</Dialog.Close>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </React.Fragment>,
    );
    await waitFor(() => expect(screen.getByText('First action')).toHaveFocus());
    await user.click(screen.getByText('Open from first'));
    await waitFor(() => expect(screen.getByText('Shared action')).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText('Shared action')).toBeNull());
    await user.click(screen.getByText('Open second modal'));
    await waitFor(() => expect(screen.getByText('Second action')).toHaveFocus());
    await user.click(screen.getByText('Open from second'));
    await waitFor(() => expect(screen.getByText('Shared action')).toHaveFocus());
  });

  test('keeps containment when a parent adopts a trigger inside its modal child', async () => {
    const first = Dialog.createHandle();
    const second = Dialog.createHandle();
    const { user } = await render(
      <React.Fragment>
        <button>Outside action</button>
        <Dialog.Root handle={first} defaultOpen>
          <Dialog.Portal>
            <Dialog.Popup>
              <button>First action</button>
              <Dialog.Trigger handle={second}>Open second</Dialog.Trigger>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <Dialog.Root handle={second}>
          <Dialog.Portal>
            <Dialog.Popup>
              <button>Second action</button>
              <Dialog.Trigger handle={first}>Return to first</Dialog.Trigger>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </React.Fragment>,
    );
    await waitFor(() => expect(screen.getByText('First action')).toHaveFocus());
    await user.click(screen.getByText('Open second'));
    await waitFor(() => expect(screen.getByText('Second action')).toHaveFocus());
    expect(screen.getByText('Return to first')).toHaveAttribute('aria-expanded', 'true');
    screen.getByText('Outside action').focus();
    expect(screen.getByText('Second action')).toHaveFocus();
  });

  test('keeps an initially-open child active when it supplies its parent trigger', async () => {
    const parent = Dialog.createHandle();
    await render(
      <Dialog.Root handle={parent} defaultOpen>
        <Dialog.Portal>
          <Dialog.Popup>
            <button>Parent action</button>
            <Dialog.Root defaultOpen>
              <Dialog.Portal>
                <Dialog.Popup>
                  <button>Child action</button>
                  <Dialog.Trigger handle={parent}>Close parent</Dialog.Trigger>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>,
    );
    await waitFor(() =>
      expect(screen.getByText('Close parent')).toHaveAttribute('aria-expanded', 'true'),
    );
    await waitFor(() => expect(screen.getByText('Child action')).toHaveFocus());
    screen.getByText('Parent action').focus();
    expect(screen.getByText('Child action')).toHaveFocus();
  });
});

import { expect, vi, describe, beforeEach, it } from 'vitest';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { act, fireEvent, screen, waitFor } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, isJSDOM, resetBrowserPointer, waitSingleFrame } from '#test-utils';

// The submenu trigger's VoiceOver branch is covered separately; keep the mainline deterministic.
vi.mock('@base-ui/utils/platform', async () => {
  const actual =
    await vi.importActual<typeof import('@base-ui/utils/platform')>('@base-ui/utils/platform');

  return {
    platform: {
      ...actual.platform,
      screenReader: { ...actual.platform.screenReader, voiceOver: false },
    },
  };
});

describe('<Menu.FilterProvider><Menu.SubmenuRoot/></Menu.FilterProvider>', () => {
  beforeEach(resetBrowserPointer);

  const { render } = createRenderer();

  /** A filterable submenu whose parent is a plain, roving-focus `Menu.Root`. */
  function PlainParentMenu(props: {
    submenuProps?: Partial<Menu.FilterProvider.Props & Menu.SubmenuRoot.Props>;
  }) {
    return (
      <Menu.Root open>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Rename</Menu.Item>
              <Menu.FilterProvider>
                <Menu.SubmenuRoot {...props.submenuProps}>
                  <Menu.SubmenuTrigger data-testid="submenu-trigger">Move to</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Input aria-label="Filter folders" />
                        <Menu.List data-testid="submenu-list">
                          <Menu.Item>Projects</Menu.Item>
                          <Menu.Item>Archive</Menu.Item>
                        </Menu.List>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.FilterProvider>
              <Menu.Item>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    );
  }

  describe('prop: inputValue', () => {
    it('renders the controlled query and reports changes', async () => {
      const onValueChange = vi.fn();

      function ControlledSubmenu() {
        const [inputValue, setInputValue] = React.useState('pro');

        return (
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Input aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.FilterProvider
                        value={inputValue}
                        onValueChange={(nextValue, eventDetails) => {
                          onValueChange(nextValue, eventDetails.reason);
                          setInputValue(nextValue);
                        }}
                      >
                        <Menu.SubmenuRoot defaultOpen>
                          <Menu.SubmenuTrigger>Move to</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup>
                                <Menu.Input aria-label="Filter folders" />
                                <Menu.List>
                                  <Menu.Item>Projects</Menu.Item>
                                  <Menu.Item>Archive</Menu.Item>
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { user } = await render(<ControlledSubmenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter folders' });
      expect(input).toHaveValue('pro');
      expect(screen.queryByRole('menuitem', { name: 'Archive' })).toBe(null);

      await user.clear(input);

      expect(onValueChange).toHaveBeenCalledWith('', 'input-clear');
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Archive' })).not.toBe(null);
      });
    });

    it('keeps the uncontrolled query when the change is canceled', async () => {
      function CancelingSubmenu() {
        return (
          <Menu.FilterProvider>
            <Menu.Root defaultOpen>
              <Menu.Trigger>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.Input aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.FilterProvider
                        defaultValue="pro"
                        onValueChange={(_, eventDetails) => eventDetails.cancel()}
                      >
                        <Menu.SubmenuRoot defaultOpen>
                          <Menu.SubmenuTrigger>Move to</Menu.SubmenuTrigger>
                          <Menu.Portal>
                            <Menu.Positioner>
                              <Menu.Popup>
                                <Menu.Input aria-label="Filter folders" />
                                <Menu.List>
                                  <Menu.Item>Projects</Menu.Item>
                                </Menu.List>
                              </Menu.Popup>
                            </Menu.Positioner>
                          </Menu.Portal>
                        </Menu.SubmenuRoot>
                      </Menu.FilterProvider>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      const { user } = await render(<CancelingSubmenu />);

      const input = screen.getByRole('searchbox', { name: 'Filter folders' });
      await user.type(input, 'x');

      expect(input).toHaveValue('pro');
    });
  });

  describe.skipIf(isJSDOM)('inside a plain parent menu', () => {
    it('closes with Escape and returns focus to the highlighted trigger', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByTestId('submenu-list')).toBe(null);
      });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
      expect(trigger).toHaveAttribute('data-highlighted');
      expect(screen.getByRole('menuitem', { name: 'Rename' })).not.toBe(null);
    });

    it('opens with the cross-axis key and focuses the submenu input', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('closes with the cross-axis close key and returns focus to the trigger', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.queryByTestId('submenu-list')).toBe(null);
      });
      await waitFor(() => {
        expect(trigger).toHaveFocus();
      });
    });

    it('hands the cursor back to the submenu input when the open key repeats', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });
      await waitFor(() => {
        expect(input).toHaveFocus();
      });

      // Move real focus back onto the trigger, then press the open key again while the submenu
      // is still open: it must re-enter rather than reopen.
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      expect(screen.getByTestId('submenu-list')).not.toBe(null);
    });

    it('moves along the parent list with the main-axis keys', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{ArrowDown}');

      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
      });
    });

    it('closes when the close key arrives while the trigger holds focus', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowRight}');

      await screen.findByRole('searchbox', { name: 'Filter folders' });

      // Put real focus back on the trigger, then press the close key there rather than in the
      // submenu popup.
      await act(async () => {
        trigger.focus();
      });
      await user.keyboard('{ArrowLeft}');

      await waitFor(() => {
        expect(screen.queryByTestId('submenu-list')).toBe(null);
      });
    });

    it('keeps focus in the submenu input when the pointer crosses the trigger again', async () => {
      const { user } = await render(
        <Menu.Root open>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Item>Rename</Menu.Item>
                <Menu.FilterProvider>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger delay={0} data-testid="submenu-trigger">
                      Move to
                    </Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup>
                          <Menu.Input aria-label="Filter folders" />
                          <Menu.List>
                            <Menu.Item>Projects</Menu.Item>
                            <Menu.Item>Archive</Menu.Item>
                          </Menu.List>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.FilterProvider>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const trigger = screen.getByTestId('submenu-trigger');
      await user.hover(trigger);
      const input = await screen.findByRole('searchbox', { name: 'Filter folders' });

      // The pointer enters the submenu and typing starts.
      fireEvent.mouseMove(input);
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await user.keyboard('ar');
      expect(input).toHaveValue('ar');

      // Commit the hover highlight before awaiting focus frames so React 18's focus updates
      // stay inside act. Crossing the trigger must not interrupt typing in the submenu.
      await act(async () => {
        ReactDOM.flushSync(() => {
          fireEvent.mouseMove(trigger);
        });
        await waitSingleFrame();
        await waitSingleFrame();
      });
      expect(input).toHaveFocus();
      await user.keyboard('c');
      expect(input).toHaveValue('arc');
      expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeVisible();
    });

    it('leaves a key that is neither an axis nor an activation key to the parent', async () => {
      const { user } = await render(<PlainParentMenu />);

      const trigger = screen.getByTestId('submenu-trigger');
      await act(async () => {
        trigger.focus();
      });

      await user.keyboard('{Home}');

      // The submenu must not open, and the parent's own Home handling still runs.
      expect(screen.queryByTestId('submenu-list')).toBe(null);
      await waitFor(() => {
        expect(screen.getByRole('menuitem', { name: 'Rename' })).toHaveFocus();
      });
    });
  });
});

describe('filtered submenu trigger navigation', () => {
  const { render } = createRenderer();

  it('prevents native scrolling when moving along the parent menu', async () => {
    await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterProvider>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger openOnHover={false}>More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Input aria-label="Filter child actions" />
                        <Menu.List>
                          <Menu.Item>Child</Menu.Item>
                        </Menu.List>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.FilterProvider>
              <Menu.Item>Next</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );
    const trigger = screen.getByRole('menuitem', { name: 'More' });
    await act(async () => trigger.focus());
    expect(fireEvent.keyDown(trigger, { key: 'ArrowDown' })).toBe(false);
    expect(screen.getByRole('menuitem', { name: 'Next' })).toHaveFocus();
  });
});

describe('closing a filtered submenu from the keyboard', () => {
  const { render } = createRenderer();

  it('ignores a close key that composes text in the submenu input', async () => {
    const { user } = await render(
      <Menu.Root defaultOpen>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.FilterProvider>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger openOnHover={false}>More</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.Input aria-label="Filter child actions" />
                        <Menu.List>
                          <Menu.Item>Child</Menu.Item>
                        </Menu.List>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              </Menu.FilterProvider>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    await act(async () => screen.getByRole('menuitem', { name: 'More' }).focus());
    await user.keyboard('[ArrowRight]');
    const input = await screen.findByRole('searchbox', { name: 'Filter child actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });

    // React derives SyntheticEvent.which from the native keyCode.
    fireEvent.keyDown(input, { key: 'ArrowLeft', keyCode: 229, which: 229 });

    // The popup can stay mounted through an exit animation, so check the open state itself.
    expect(screen.getByRole('menuitem', { name: 'More' })).toHaveAttribute('data-popup-open');
    expect(input).toHaveFocus();
  });

  function Submenu(props: { filterable: boolean; container?: ShadowRoot }) {
    const submenu = (
      <Menu.SubmenuRoot>
        <Menu.SubmenuTrigger>More</Menu.SubmenuTrigger>
        <Menu.Portal container={props.container}>
          <Menu.Positioner>
            <Menu.Popup data-testid="submenu">
              {props.filterable && <Menu.Input aria-label="Filter child actions" />}
              <Menu.List>
                <Menu.Item>Child</Menu.Item>
              </Menu.List>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.SubmenuRoot>
    );
    return props.filterable ? <Menu.FilterProvider>{submenu}</Menu.FilterProvider> : submenu;
  }

  it.each([
    { parentFilterable: false, submenuFilterable: true },
    { parentFilterable: true, submenuFilterable: false },
    { parentFilterable: true, submenuFilterable: true },
  ])(
    'moves a horizontal parent on when a vertical submenu closes on its main-axis key (filterable parent: $parentFilterable, filterable submenu: $submenuFilterable)',
    async ({ parentFilterable, submenuFilterable }) => {
      const menu = (
        <Menu.Root orientation="horizontal">
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                {parentFilterable && <Menu.Input aria-label="Filter actions" />}
                <Menu.List>
                  <Menu.Item>First</Menu.Item>
                  <Submenu filterable={submenuFilterable} />
                  <Menu.Item>Last</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      );
      const { user } = await render(
        parentFilterable ? <Menu.FilterProvider>{menu}</Menu.FilterProvider> : menu,
      );

      await act(async () => screen.getByRole('button', { name: 'Actions' }).focus());
      await user.keyboard('[Enter]');
      await user.keyboard('[ArrowRight]');
      const trigger = screen.getByRole('menuitem', { name: 'More' });
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-highlighted');
      });

      await user.keyboard('[ArrowDown]');
      await screen.findByTestId('submenu');
      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(screen.queryByTestId('submenu')).toBe(null);
      });
      expect(screen.getByRole('menuitem', { name: 'First' })).toHaveAttribute('data-highlighted');
      expect(trigger).not.toHaveAttribute('data-highlighted');
    },
  );

  it.each([false, true])(
    'does not wrap a filterable parent when closing from its first item (filterable submenu: %s)',
    async (submenuFilterable) => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root orientation="horizontal">
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter actions" />
                  <Menu.List>
                    <Submenu filterable={submenuFilterable} />
                    <Menu.Item>Middle</Menu.Item>
                    <Menu.Item>Last</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await act(async () => screen.getByRole('button', { name: 'Actions' }).focus());
      await user.keyboard('[Enter]');
      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      const trigger = screen.getByRole('menuitem', { name: 'More' });
      await waitFor(() => {
        expect(input).toHaveAttribute('aria-activedescendant', trigger.id);
      });

      await user.keyboard('[ArrowDown]');
      await screen.findByTestId('submenu');
      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(screen.queryByTestId('submenu')).toBe(null);
      });
      expect(input).toHaveFocus();
      expect(input).toHaveAttribute('aria-activedescendant', trigger.id);
      expect(screen.getByRole('menuitem', { name: 'Last' })).not.toHaveAttribute(
        'data-highlighted',
      );
    },
  );

  it('moves a filterable parent on when a submenu portaled into a shadow root closes', async () => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadowRoot = host.attachShadow({ mode: 'open' });

    try {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root orientation="horizontal">
            <Menu.Trigger>Actions</Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Input aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>First</Menu.Item>
                    <Submenu filterable={false} container={shadowRoot} />
                    <Menu.Item>Last</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );

      await act(async () => screen.getByRole('button', { name: 'Actions' }).focus());
      await user.keyboard('[Enter]');
      await user.keyboard('[ArrowRight]');
      const trigger = screen.getByRole('menuitem', { name: 'More' });
      await waitFor(() => {
        expect(trigger).toHaveAttribute('data-highlighted');
      });

      await user.keyboard('[ArrowDown]');
      await waitFor(() => {
        expect(shadowRoot.querySelector('[data-testid="submenu"]')).not.toBe(null);
      });
      await user.keyboard('[ArrowLeft]');

      await waitFor(() => {
        expect(shadowRoot.querySelector('[data-testid="submenu"]')).toBe(null);
      });
      expect(screen.getByRole('menuitem', { name: 'First' })).toHaveAttribute('data-highlighted');
    } finally {
      host.remove();
    }
  });
});

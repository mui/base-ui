import * as React from 'react';
import { expect, describe, it, vi } from 'vitest';
import { act, screen, waitFor } from '@mui/internal-test-utils';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { Menu } from '@base-ui/react/menu';
import { createRenderer } from '#test-utils';

describe('<Menu.FilterProvider><Menu.Root/></Menu.FilterProvider>', () => {
  const { render } = createRenderer();

  function FilterableMenu(props: {
    filterProps?: Partial<Menu.FilterProvider.Props>;
    submenu?: React.ReactNode;
  }) {
    return (
      <Menu.FilterProvider {...props.filterProps}>
        <Menu.Root open>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                  <Menu.Item keywords={['remove']}>Delete</Menu.Item>
                  <Menu.Item>Duplicate</Menu.Item>
                  {props.submenu}
                </Menu.List>
                <Menu.FilterEmpty>No results</Menu.FilterEmpty>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>
    );
  }

  it('makes the menu filterable', async () => {
    await render(<FilterableMenu />);

    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
    const popup = screen.getByRole('dialog', { name: 'Actions' });
    expect(popup).toContainElement(screen.getByRole('searchbox', { name: 'Filter actions' }));
    expect(popup).toContainElement(screen.getByRole('menu'));
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
  });

  it('filters items by text and keywords and shows the empty state', async () => {
    const { user } = await render(<FilterableMenu />);
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });

    await act(async () => {
      input.focus();
    });
    await user.type(input, 'rem');

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Rename' })).toBe(null);
    });
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
    expect(screen.queryByRole('status')).toBe(null);

    await user.clear(input);
    await user.type(input, 'zzz');

    await waitFor(() => {
      expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
    });
    expect(screen.getByRole('status')).toHaveTextContent('No results');
  });

  it('navigates the list from the input with aria-activedescendant', async () => {
    const onClick = vi.fn();
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root open>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item onClick={onClick}>Rename</Menu.Item>
                  <Menu.Item>Delete</Menu.Item>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });

    await act(async () => {
      input.focus();
    });
    await user.keyboard('[ArrowDown]');

    const rename = screen.getByRole('menuitem', { name: 'Rename' });
    expect(input).toHaveAttribute('aria-activedescendant', rename.id);
    expect(input).toHaveFocus();

    await user.keyboard('[Enter]');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('supports a controlled query', async () => {
    const onInputValueChange = vi.fn();
    const { user } = await render(
      <FilterableMenu filterProps={{ inputValue: 'dup', onInputValueChange }} />,
    );
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });

    expect(input).toHaveValue('dup');
    expect(screen.getAllByRole('menuitem')).toHaveLength(1);
    expect(screen.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible();

    await act(async () => {
      input.focus();
    });
    await user.type(input, 'x');
    expect(onInputValueChange).toHaveBeenCalledWith('dupx', expect.anything());
    // The consumer owns the value, so nothing changes until it updates the prop.
    expect(input).toHaveValue('dup');
  });

  it('leaves a plain menu untouched', async () => {
    await render(
      <Menu.Root open>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item keywords={['remove']}>Delete</Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>,
    );

    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );
    expect(screen.getByRole('menu')).toBeVisible();
    expect(screen.queryByRole('dialog')).toBe(null);
    expect(screen.getByRole('menuitem', { name: 'Delete' })).not.toHaveAttribute('keywords');
  });

  it('throws when a filter part is rendered in a plain menu', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(
        render(
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput />
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>,
        ),
      ).rejects.toThrow('Base UI: Filter parts must be placed within a filterable menu.');
    } finally {
      errorSpy.mockRestore();
    }
  });

  it('does not extend to a plain submenu inside the filterable menu', async () => {
    const { user } = await render(
      <FilterableMenu
        submenu={
          <Menu.SubmenuRoot>
            <Menu.SubmenuTrigger>Move to</Menu.SubmenuTrigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Item>Projects</Menu.Item>
                  <Menu.Item>Archive</Menu.Item>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.SubmenuRoot>
        }
      />,
    );

    const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to' });
    expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'menu');

    await user.click(submenuTrigger);

    const submenu = await screen.findByRole('menu', { name: 'Move to' });
    expect(submenu).toBeVisible();
    expect(screen.getAllByRole('searchbox')).toHaveLength(1);

    // The trigger is still an item of the filterable parent list, so the parent query hides it.
    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await act(async () => {
      input.focus();
    });
    await user.type(input, 'ren');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Move to' })).toBe(null);
    });
  });

  it('filters a submenu that uses FilterSubmenuRoot', async () => {
    const { user } = await render(
      <FilterableMenu
        submenu={
          <Menu.FilterProvider>
            <Menu.SubmenuRoot>
              <Menu.SubmenuTrigger>Move to</Menu.SubmenuTrigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter folders" />
                    <Menu.List>
                      <Menu.Item>Projects</Menu.Item>
                      <Menu.Item>Archive</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.SubmenuRoot>
          </Menu.FilterProvider>
        }
      />,
    );

    const submenuTrigger = screen.getByRole('menuitem', { name: 'Move to' });
    expect(submenuTrigger).toHaveAttribute('aria-haspopup', 'dialog');

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await act(async () => {
      input.focus();
    });
    await user.keyboard('[ArrowDown][ArrowDown][ArrowDown][ArrowDown]');
    expect(input).toHaveAttribute('aria-activedescendant', submenuTrigger.id);

    await user.keyboard('[ArrowRight]');

    const submenuInput = await screen.findByRole('searchbox', { name: 'Filter folders' });
    await waitFor(() => {
      expect(submenuInput).toHaveFocus();
    });
    await user.type(submenuInput, 'arch');
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: 'Projects' })).toBe(null);
    });
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toBeVisible();
    // The parent list is untouched by the submenu query.
    expect(screen.getByRole('menuitem', { name: 'Rename' })).toBeVisible();
  });

  it('filters a submenu of a plain menu', async () => {
    await render(
      <Menu.Root open>
        <Menu.Trigger>Actions</Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner>
            <Menu.Popup>
              <Menu.Item>Rename</Menu.Item>
              <Menu.FilterProvider>
                <Menu.SubmenuRoot open>
                  <Menu.SubmenuTrigger>Move to</Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner>
                      <Menu.Popup>
                        <Menu.FilterInput aria-label="Filter folders" />
                        <Menu.List>
                          <Menu.Item>Projects</Menu.Item>
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

    expect(screen.getByRole('button', { name: 'Actions' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    );
    expect(screen.getByRole('menuitem', { name: 'Move to' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
    expect(screen.getByRole('dialog', { name: 'Move to' })).toContainElement(
      screen.getByRole('searchbox', { name: 'Filter folders' }),
    );
  });

  it('announces a dialog from a detached trigger whose handle is filterable', async () => {
    function Test() {
      const handle = useRefWithInit(() => Menu.createHandle({ filterable: true })).current;

      return (
        <React.Fragment>
          <Menu.Trigger handle={handle}>Actions</Menu.Trigger>
          <Menu.FilterProvider>
            <Menu.Root handle={handle}>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        </React.Fragment>
      );
    }

    const { user } = await render(<Test />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');

    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByRole('searchbox', { name: 'Filter actions' })).toHaveFocus();
    });
  });

  it('enters and leaves a plain submenu with the cross-axis keys from the input', async () => {
    const { user } = await render(
      <Menu.FilterProvider>
        <Menu.Root defaultOpen>
          <Menu.Trigger>Actions</Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.FilterInput aria-label="Filter actions" />
                <Menu.List>
                  <Menu.Item>Rename</Menu.Item>
                  <Menu.SubmenuRoot>
                    <Menu.SubmenuTrigger>Share</Menu.SubmenuTrigger>
                    <Menu.Portal>
                      <Menu.Positioner>
                        <Menu.Popup data-testid="submenu">
                          <Menu.Item>Email</Menu.Item>
                          <Menu.Item>Copy link</Menu.Item>
                        </Menu.Popup>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.SubmenuRoot>
                </Menu.List>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Menu.FilterProvider>,
    );

    const input = screen.getByRole('searchbox', { name: 'Filter actions' });
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    await user.keyboard('[ArrowDown][ArrowDown]');
    const trigger = screen.getByRole('menuitem', { name: 'Share' });
    expect(input).toHaveAttribute('aria-activedescendant', trigger.id);

    // A plain submenu roves real focus, so entering it hands focus to its first item.
    await user.keyboard('[ArrowRight]');
    const email = await screen.findByRole('menuitem', { name: 'Email' });
    await waitFor(() => {
      expect(email).toHaveFocus();
    });
    await user.keyboard('[ArrowDown]');
    expect(screen.getByRole('menuitem', { name: 'Copy link' })).toHaveFocus();

    // Leaving returns focus to the input with the trigger still highlighted.
    await user.keyboard('[ArrowLeft]');
    await waitFor(() => {
      expect(screen.queryByTestId('submenu')).toBe(null);
    });
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-activedescendant', trigger.id);
  });

  describe('trigger key relay', () => {
    function HoverMenu() {
      return (
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger openOnHover delay={0}>
              Actions
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item>Delete</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    async function openByHover(user: Awaited<ReturnType<typeof render>>['user']) {
      const trigger = screen.getByRole('button', { name: 'Actions' });
      await act(async () => {
        trigger.focus();
      });
      await user.hover(trigger);
      const input = await screen.findByRole('searchbox', { name: 'Filter actions' });
      // A hover open shows the popup without moving focus off the trigger.
      expect(trigger).toHaveFocus();
      return { trigger, input };
    }

    it('moves ArrowDown from the trigger into the input and highlights the first item', async () => {
      const { user } = await render(<HoverMenu />);
      const { input } = await openByHover(user);

      await user.keyboard('[ArrowDown]');

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          screen.getByRole('menuitem', { name: 'Rename' }).id,
        );
      });
    });

    it('moves a typed character from the trigger into the input', async () => {
      const { user } = await render(<HoverMenu />);
      const { input } = await openByHover(user);

      await user.keyboard('r');

      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('keeps focus on the trigger for modified keys and cross-axis arrows', async () => {
      const { user } = await render(<HoverMenu />);
      const { trigger, input } = await openByHover(user);

      await user.keyboard('{Control>}r{/Control}');
      expect(trigger).toHaveFocus();

      await user.keyboard('[ArrowRight]');
      expect(trigger).toHaveFocus();
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    it('lets a consumer onKeyDown cancel the relay', async () => {
      const { user } = await render(
        <Menu.FilterProvider>
          <Menu.Root>
            <Menu.Trigger
              openOnHover
              delay={0}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown') {
                  event.preventBaseUIHandler();
                }
              }}
            >
              Actions
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>,
      );
      const { trigger } = await openByHover(user);

      await user.keyboard('[ArrowDown]');
      expect(trigger).toHaveFocus();
    });
  });

  describe('development warnings', () => {
    it('warns when a filterable menu opens without an input', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      try {
        await render(
          <Menu.FilterProvider>
            <Menu.Root open>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>,
        );

        // Effects run twice under Strict Mode, so only the message is pinned.
        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls[0][0]).toContain('opened without a <Menu.FilterInput>');
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('warns when the handle was created without the filterable option', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      function Test() {
        const handle = useRefWithInit(() => Menu.createHandle()).current;
        return (
          <Menu.FilterProvider>
            <Menu.Root handle={handle}>
              <Menu.Trigger handle={handle}>Actions</Menu.Trigger>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      try {
        await render(<Test />);

        expect(warnSpy).toHaveBeenCalled();
        expect(warnSpy.mock.calls[0][0]).toContain('filterable: true');
      } finally {
        warnSpy.mockRestore();
      }
    });

    it('does not warn for a filterable menu with an input and a filterable handle', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      function Test() {
        const handle = useRefWithInit(() => Menu.createHandle({ filterable: true })).current;
        return (
          <Menu.FilterProvider>
            <Menu.Root handle={handle} open>
              <Menu.Trigger handle={handle}>Actions</Menu.Trigger>
              <Menu.Portal>
                <Menu.Positioner>
                  <Menu.Popup>
                    <Menu.FilterInput aria-label="Filter actions" />
                    <Menu.List>
                      <Menu.Item>Rename</Menu.Item>
                    </Menu.List>
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            </Menu.Root>
          </Menu.FilterProvider>
        );
      }

      try {
        await render(<Test />);
        expect(warnSpy).not.toHaveBeenCalled();
      } finally {
        warnSpy.mockRestore();
      }
    });
  });

  describe('prop: onItemHighlighted', () => {
    function HighlightMenu(props: {
      onItemHighlighted: Menu.Root.Props['onItemHighlighted'];
      autoHighlight?: boolean;
    }) {
      return (
        <Menu.FilterProvider autoHighlight={props.autoHighlight}>
          <Menu.Root open onItemHighlighted={props.onItemHighlighted}>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.FilterInput aria-label="Filter actions" />
                  <Menu.List>
                    <Menu.Item>Rename</Menu.Item>
                    <Menu.Item label="Remove">Delete</Menu.Item>
                    <Menu.Item>Duplicate</Menu.Item>
                  </Menu.List>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        </Menu.FilterProvider>
      );
    }

    it('reports keyboard highlights while the input keeps focus', async () => {
      const onItemHighlighted = vi.fn();
      const { user } = await render(<HighlightMenu onItemHighlighted={onItemHighlighted} />);
      const input = screen.getByRole('searchbox', { name: 'Filter actions' });

      await act(async () => {
        input.focus();
      });
      await user.keyboard('[ArrowDown][ArrowDown]');

      const remove = screen.getByRole('menuitem', { name: 'Delete' });
      expect(input).toHaveFocus();
      expect(onItemHighlighted).toHaveBeenCalledTimes(2);
      expect(onItemHighlighted).toHaveBeenLastCalledWith(
        remove,
        expect.objectContaining({ reason: 'keyboard', index: 1, label: 'Remove' }),
      );
    });

    it('reports the auto-highlighted item as a programmatic change', async () => {
      const onItemHighlighted = vi.fn();
      const { user } = await render(
        <HighlightMenu autoHighlight onItemHighlighted={onItemHighlighted} />,
      );
      const input = screen.getByRole('searchbox', { name: 'Filter actions' });

      await act(async () => {
        input.focus();
      });
      await user.type(input, 'dup');

      await waitFor(() => {
        expect(onItemHighlighted).toHaveBeenCalledTimes(1);
      });
      expect(onItemHighlighted).toHaveBeenCalledWith(
        screen.getByRole('menuitem', { name: 'Duplicate' }),
        expect.objectContaining({ reason: 'none', index: 0, label: 'Duplicate' }),
      );

      await user.type(input, 'zzz');

      await waitFor(() => {
        expect(onItemHighlighted).toHaveBeenCalledTimes(2);
      });
      expect(onItemHighlighted).toHaveBeenLastCalledWith(
        undefined,
        expect.objectContaining({ reason: 'none', index: -1, label: undefined }),
      );
    });
  });
});

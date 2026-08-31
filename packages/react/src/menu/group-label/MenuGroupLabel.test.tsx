import { afterEach, expect, vi } from 'vitest';
import * as React from 'react';
import { act, screen } from '@mui/internal-test-utils';
import { Menu } from '@base-ui/react/menu';
import { createRenderer, describeConformance } from '#test-utils';
import { MenuGroupContext } from '../group/MenuGroupContext';

const testContext: MenuGroupContext = () => {};

describe('<Menu.GroupLabel />', () => {
  const { render } = createRenderer();

  afterEach(async () => {
    await act(
      () =>
        new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        }),
    );
  });

  describeConformance(<Menu.GroupLabel />, () => ({
    render: (node) => {
      return render(
        <MenuGroupContext.Provider value={testContext}>{node}</MenuGroupContext.Provider>,
      );
    },
    refInstanceof: window.HTMLDivElement,
  }));

  it('throws when rendered outside Menu.Group or Menu.RadioGroup', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(render(<Menu.GroupLabel />)).rejects.toThrow(
        'Base UI: MenuGroupContext is missing. Menu group parts must be used within <Menu.Group> or <Menu.RadioGroup>.',
      );
    } finally {
      errorSpy.mockRestore();
    }
  });

  describe('a11y attributes', () => {
    it('is hidden from the accessibility tree by default', async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const groupLabel = screen.getByText('Test group');
      expect(groupLabel).toHaveAttribute('aria-hidden', 'true');
    });

    it('allows overriding aria-hidden', async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel aria-hidden={undefined}>Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const groupLabel = screen.getByText('Test group');
      expect(groupLabel).not.toHaveAttribute('aria-hidden');
    });

    it("should reference the generated id in Group's `aria-labelledby`", async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const group = screen.getByRole('group');
      const groupLabel = screen.getByText('Test group');

      expect(group).toHaveAttribute('aria-labelledby', groupLabel.id);
    });

    it("should reference the provided id in Group's `aria-labelledby`", async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group>
                  <Menu.GroupLabel id="test-group">Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'test-group');
    });

    it("should reference the generated id in RadioGroup's `aria-labelledby`", async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.RadioGroup>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.RadioGroup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const radioGroup = screen.getByRole('group');
      const groupLabel = screen.getByText('Test group');

      expect(radioGroup).toHaveAttribute('aria-labelledby', groupLabel.id);
    });

    it("should reference the provided id in RadioGroup's `aria-labelledby`", async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.RadioGroup>
                  <Menu.GroupLabel id="test-group">Test group</Menu.GroupLabel>
                </Menu.RadioGroup>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const radioGroup = screen.getByRole('group');
      expect(radioGroup).toHaveAttribute('aria-labelledby', 'test-group');
    });

    it('should support GroupLabel when RadioGroup is rendered as Group', async () => {
      await render(
        <Menu.Root open>
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup>
                <Menu.Group render={<Menu.RadioGroup />}>
                  <Menu.GroupLabel>Test group</Menu.GroupLabel>
                </Menu.Group>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>,
      );

      const radioGroup = screen.getByRole('group');
      const groupLabel = screen.getByText('Test group');

      expect(radioGroup).toHaveAttribute('aria-labelledby', groupLabel.id);
    });

    it('does not let an older label cleanup clear a newer label', async () => {
      function Test({ labels }: { labels: 'old' | 'both' | 'new' }) {
        return (
          <Menu.Root open>
            <Menu.Portal>
              <Menu.Positioner>
                <Menu.Popup>
                  <Menu.Group>
                    {labels !== 'new' && (
                      <Menu.GroupLabel key="old" id="old-label">
                        Old
                      </Menu.GroupLabel>
                    )}
                    {labels !== 'old' && (
                      <Menu.GroupLabel key="new" id="new-label">
                        New
                      </Menu.GroupLabel>
                    )}
                  </Menu.Group>
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
        );
      }

      const { rerender } = await render(<Test labels="old" />);

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'old-label');

      await rerender(<Test labels="both" />);
      expect(group).toHaveAttribute('aria-labelledby', 'new-label');

      await rerender(<Test labels="new" />);
      expect(group).toHaveAttribute('aria-labelledby', 'new-label');
    });
  });
});

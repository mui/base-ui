import { expect, describe, it } from 'vitest';
import * as React from 'react';
import { Combobox } from '@base-ui/react/combobox';
import { createRenderer, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';

describe('<Combobox.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Combobox.GroupLabel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Combobox.Root open>
          <Combobox.Group>{node}</Combobox.Group>
        </Combobox.Root>,
      );
    },
  }));

  describe('a11y attributes', () => {
    it('wires to group aria-labelledby', async () => {
      await render(
        <Combobox.Root open>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Group>
                  <Combobox.GroupLabel>Label</Combobox.GroupLabel>
                </Combobox.Group>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const group = screen.getByRole('group');
      const label = screen.getByText('Label');
      expect(group).toHaveAttribute('aria-labelledby', label.id);
    });

    it('is hidden from the accessibility tree by default', async () => {
      await render(
        <Combobox.Root open>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Group>
                  <Combobox.GroupLabel>Label</Combobox.GroupLabel>
                </Combobox.Group>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByText('Label')).toHaveAttribute('aria-hidden', 'true');
    });

    it('allows overriding aria-hidden', async () => {
      await render(
        <Combobox.Root open>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Group>
                  <Combobox.GroupLabel aria-hidden={undefined}>Label</Combobox.GroupLabel>
                </Combobox.Group>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      expect(screen.getByText('Label')).not.toHaveAttribute('aria-hidden');
    });

    it('uses provided id in aria-labelledby', async () => {
      await render(
        <Combobox.Root open>
          <Combobox.Portal>
            <Combobox.Positioner>
              <Combobox.Popup>
                <Combobox.Group>
                  <Combobox.GroupLabel id="test-group">Label</Combobox.GroupLabel>
                </Combobox.Group>
              </Combobox.Popup>
            </Combobox.Positioner>
          </Combobox.Portal>
        </Combobox.Root>,
      );

      const group = screen.getByRole('group');
      expect(group).toHaveAttribute('aria-labelledby', 'test-group');
    });

    it('does not let an older label cleanup clear a newer label', async () => {
      function Test({ labels }: { labels: 'old' | 'both' | 'new' }) {
        return (
          <Combobox.Root open>
            <Combobox.Group>
              {labels !== 'new' && (
                <Combobox.GroupLabel key="old" id="old-label">
                  Old
                </Combobox.GroupLabel>
              )}
              {labels !== 'old' && (
                <Combobox.GroupLabel key="new" id="new-label">
                  New
                </Combobox.GroupLabel>
              )}
            </Combobox.Group>
          </Combobox.Root>
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

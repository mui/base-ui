import { expect, describe, it } from 'vitest';
import { Listbox } from '@base-ui/react/listbox';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Listbox.GroupLabel />', () => {
  const { render } = createRenderer();

  describeConformance(<Listbox.GroupLabel />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Group>{node}</Listbox.Group>
          </Listbox.List>
        </Listbox.Root>,
      );
    },
  }));

  describe('a11y attributes', () => {
    it('is hidden from the accessibility tree, since it names the group', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Group>
              <Listbox.GroupLabel>Label</Listbox.GroupLabel>
            </Listbox.Group>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByText('Label')).toHaveAttribute('aria-hidden', 'true');
    });

    it('allows overriding aria-hidden', async () => {
      await render(
        <Listbox.Root>
          <Listbox.List>
            <Listbox.Group>
              <Listbox.GroupLabel aria-hidden={undefined}>Label</Listbox.GroupLabel>
            </Listbox.Group>
          </Listbox.List>
        </Listbox.Root>,
      );

      expect(screen.getByText('Label')).not.toHaveAttribute('aria-hidden');
    });
  });
});

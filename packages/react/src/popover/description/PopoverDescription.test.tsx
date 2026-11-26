import { expect, describe, it } from 'vitest';
import { Popover } from '@base-ui/react/popover';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
    render(node) {
      return render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>{node}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );
    },
  }));

  it('describes the popup element with its id', async () => {
    await render(
      <Popover.Root open>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Description>Title</Popover.Description>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    const id = document.querySelector('p')?.id;
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', id);
  });

  describe('prop: id', () => {
    it('describes the popup element with a custom id', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Description id="custom-description">Description</Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Description')).toHaveAttribute('id', 'custom-description');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'custom-description');
    });

    it('keeps the generated id when undefined', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Description id={undefined}>Description</Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const description = screen.getByText('Description');
      expect(description.id).not.toBe('');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', description.id);
    });
  });

  describe('prop: render', () => {
    it('describes the popup with the id of the render element', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Description render={<p id="custom" />}>Description</Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Description')).toHaveAttribute('id', 'custom');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'custom');
    });

    it('does not reference a missing id when the render element removes it', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Description render={<p id={undefined} />}>Description</Popover.Description>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByText('Description')).not.toHaveAttribute('id');
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    });
  });
});

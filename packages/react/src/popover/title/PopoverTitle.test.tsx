import { expect, describe, it } from 'vitest';
import { Popover } from '@base-ui/react/popover';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Popover.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<Popover.Title />, () => ({
    refInstanceof: window.HTMLHeadingElement,
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

  it('labels the popup element with its id', async () => {
    await render(
      <Popover.Root open>
        <Popover.Trigger>Trigger</Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Popup>
              <Popover.Title>Title</Popover.Title>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>,
    );

    const id = document.querySelector('h2')?.id;
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', id);
  });

  describe('prop: id', () => {
    it('labels the popup element with a custom id', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Title id="custom-title">Title</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByRole('heading')).toHaveAttribute('id', 'custom-title');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'custom-title');
    });

    it('keeps the generated id when undefined', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Title id={undefined}>Title</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      const title = screen.getByRole('heading');
      expect(title.id).not.toBe('');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', title.id);
    });
  });
});

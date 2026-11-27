import * as React from 'react';
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

  describe('prop: render', () => {
    it('labels the popup with the id of the render element', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Title render={<h2 id="custom" />}>Title</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByRole('heading')).toHaveAttribute('id', 'custom');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'custom');
    });

    it('does not reference a missing id when the render element removes it', async () => {
      await render(
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                <Popover.Title render={<h2 id={undefined} />}>Title</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
      );

      expect(screen.getByRole('heading')).not.toHaveAttribute('id');
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
    });
  });
  describe('with two titles', () => {
    function Fixture({
      oldRender,
      withOld = true,
    }: {
      oldRender?: React.ReactElement | undefined;
      withOld?: boolean | undefined;
    }) {
      return (
        <Popover.Root open>
          <Popover.Trigger>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner>
              <Popover.Popup>
                {withOld && (
                  <Popover.Title id="old-title" render={oldRender}>
                    Old
                  </Popover.Title>
                )}
                <Popover.Title id="new-title">New</Popover.Title>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      );
    }

    it('does not let an older title without an id clear the newer title', async () => {
      const { setProps } = await render(<Fixture />);

      const popup = screen.getByRole('dialog');
      expect(popup).toHaveAttribute('aria-labelledby', 'new-title');

      await setProps({ oldRender: <h2 id={undefined} /> });
      expect(popup).toHaveAttribute('aria-labelledby', 'new-title');
    });

    it('does not let an older title that unmounts clear the newer title', async () => {
      const { setProps } = await render(<Fixture />);

      const popup = screen.getByRole('dialog');
      expect(popup).toHaveAttribute('aria-labelledby', 'new-title');

      await setProps({ withOld: false });
      expect(popup).toHaveAttribute('aria-labelledby', 'new-title');
    });
  });
});

import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Title />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Title />, () => ({
    refInstanceof: window.HTMLHeadingElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>{node}</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );
    },
  }));

  describe('prop: render', () => {
    it('labels the popup with the id of the render element', async () => {
      await render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title render={<h2 id="custom" />}>Title</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(screen.getByRole('heading')).toHaveAttribute('id', 'custom');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'custom');
    });

    it('does not reference a missing id when the render element removes it', async () => {
      await render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Title render={<h2 id={undefined} />}>Title</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
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
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>
              {withOld && (
                <Dialog.Title id="old-title" render={oldRender}>
                  Old
                </Dialog.Title>
              )}
              <Dialog.Title id="new-title">New</Dialog.Title>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
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

import * as React from 'react';
import { expect, describe, it } from 'vitest';
import { screen } from '@mui/internal-test-utils';
import { Dialog } from '@base-ui/react/dialog';
import { createRenderer, describeConformance } from '#test-utils';

describe('<Dialog.Description />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Description />, () => ({
    refInstanceof: window.HTMLParagraphElement,
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
    it('describes the popup with the id of the render element', async () => {
      await render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Description render={<p id="custom" />}>Description</Dialog.Description>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(screen.getByText('Description')).toHaveAttribute('id', 'custom');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby', 'custom');
    });

    it('does not reference a missing id when the render element removes it', async () => {
      await render(
        <Dialog.Root open modal={false}>
          <Dialog.Portal>
            <Dialog.Popup>
              <Dialog.Description render={<p id={undefined} />}>Description</Dialog.Description>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>,
      );

      expect(screen.getByText('Description')).not.toHaveAttribute('id');
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
    });
  });
  describe('with two descriptions', () => {
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
                <Dialog.Description id="old-description" render={oldRender}>
                  Old
                </Dialog.Description>
              )}
              <Dialog.Description id="new-description">New</Dialog.Description>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      );
    }

    it('does not let an older description without an id clear the newer description', async () => {
      const { setProps } = await render(<Fixture />);

      const popup = screen.getByRole('dialog');
      expect(popup).toHaveAttribute('aria-describedby', 'new-description');

      await setProps({ oldRender: <p id={undefined} /> });
      expect(popup).toHaveAttribute('aria-describedby', 'new-description');
    });

    it('does not let an older description that unmounts clear the newer description', async () => {
      const { setProps } = await render(<Fixture />);

      const popup = screen.getByRole('dialog');
      expect(popup).toHaveAttribute('aria-describedby', 'new-description');

      await setProps({ withOld: false });
      expect(popup).toHaveAttribute('aria-describedby', 'new-description');
    });
  });
});

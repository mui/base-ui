import * as React from 'react';
import { expect } from 'chai';
import * as Dialog from '@base_ui/react/Dialog';
import { describeConformance, createRenderer } from '../../../test';

describe('<Dialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(
        <Dialog.Root open modal={false} animated={false}>
          {node}
        </Dialog.Root>,
      );
    },
  }));

  describe('prop: keepMounted', () => {
    [
      [true, true],
      [false, false],
      [undefined, false],
    ].forEach(([keepMounted, expectedIsMounted]) => {
      it(`should ${!expectedIsMounted ? 'not ' : ''}keep the dialog mounted when keepMounted=${keepMounted}`, async () => {
        const { queryByRole } = await render(
          <Dialog.Root open={false} modal={false} animated={false}>
            <Dialog.Popup keepMounted={keepMounted} />
          </Dialog.Root>,
        );

        const dialog = queryByRole('dialog', { hidden: true });
        if (expectedIsMounted) {
          expect(dialog).not.to.equal(null);
          expect(dialog).toBeInaccessible();
        } else {
          expect(dialog).to.equal(null);
        }
      });
    });
  });
});

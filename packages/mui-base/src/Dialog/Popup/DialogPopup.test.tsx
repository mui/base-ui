import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import * as Dialog from '@base_ui/react/Dialog';
import { describeConformance } from '../../../test/describeConformance';

describe('<Dialog.Popup />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Popup />, () => ({
    refInstanceof: window.HTMLDivElement,
    render: (node) => {
      return render(<Dialog.Root open>{node}</Dialog.Root>);
    },
    skip: ['reactTestRenderer'],
  }));

  describe('prop: keepMounted', () => {
    [
      [true, true],
      [false, false],
      [undefined, false],
    ].forEach(([keepMounted, expectedIsMounted]) => {
      it(`should ${!expectedIsMounted ? 'not ' : ''}keep the dialog mounted when keepMounted=${keepMounted}`, () => {
        const { queryByRole } = render(
          <Dialog.Root open={false}>
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

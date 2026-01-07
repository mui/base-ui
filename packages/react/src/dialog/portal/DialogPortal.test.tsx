import * as React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { createRenderer, describeConformance } from '#test-utils';
import { expect } from 'vitest';
import { screen } from '@mui/internal-test-utils';

describe('<Dialog.Portal />', () => {
  const { render } = createRenderer();

  describeConformance(<Dialog.Portal />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<Dialog.Root open>{node}</Dialog.Root>);
    },
  }));

  describe('Suspense integration', () => {
    // Issue #3695
    it('should not throw "Maximum update depth exceeded" when Suspense boundary is outside Portal', async () => {
      const promise = Promise.resolve('Greetings');

      function Message({ messagePromise }: { messagePromise: Promise<string> }) {
        const value = React.use(messagePromise);
        return <p>{value}</p>;
      }

      await render(
        <React.Suspense fallback="Loading...">
          <Dialog.Root open>
            <Dialog.Portal>
              <Dialog.Popup>
                <Message messagePromise={promise} />
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>
        </React.Suspense>,
      );

      expect(screen.getByText('Greetings')).not.to.equal(null);
    });
  });
});

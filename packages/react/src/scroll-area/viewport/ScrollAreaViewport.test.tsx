import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { createRenderer, isJSDOM, describeConformance } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { expect } from 'chai';

describe('<ScrollArea.Viewport />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Viewport />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));

  describe.skipIf(isJSDOM)('overflow data attributes (viewport)', () => {
    const VIEWPORT_SIZE = 200;
    const SCROLLABLE_CONTENT_SIZE = 1000;

    it('applies data attributes on viewport', async () => {
      await render(
        <ScrollArea.Root style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: SCROLLABLE_CONTENT_SIZE, height: SCROLLABLE_CONTENT_SIZE }} />
          </ScrollArea.Viewport>
        </ScrollArea.Root>,
      );

      const viewport = screen.getByTestId('viewport');

      expect(viewport).to.have.attribute('data-has-overflow-x');
      expect(viewport).to.have.attribute('data-has-overflow-y');
      expect(viewport).not.to.have.attribute('data-overflow-x-start');
      expect(viewport).to.have.attribute('data-overflow-x-end');
      expect(viewport).not.to.have.attribute('data-overflow-y-start');
      expect(viewport).to.have.attribute('data-overflow-y-end');
    });
  });
});

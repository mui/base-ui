import { ScrollArea } from '@base-ui/react/scroll-area';
import { expect } from 'chai';
import { screen } from '@mui/internal-test-utils';
import { createRenderer, isJSDOM } from '#test-utils';
import { describeConformance } from '../../../test/describeConformance';

describe('<ScrollArea.Corner />', () => {
  const { render } = createRenderer();

  describeConformance(<ScrollArea.Corner />, () => ({
    refInstanceof: window.HTMLDivElement,
    render(node) {
      return render(<ScrollArea.Root>{node}</ScrollArea.Root>);
    },
  }));

  describe.skipIf(isJSDOM)('interactions', () => {
    it('should apply correct corner size when both scrollbars are present', async () => {
      await render(
        <ScrollArea.Root style={{ width: 200, height: 200 }}>
          <ScrollArea.Viewport data-testid="viewport" style={{ width: '100%', height: '100%' }}>
            <div style={{ width: 1000, height: 1000 }} />
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar orientation="vertical" style={{ width: 10 }} />
          <ScrollArea.Scrollbar orientation="horizontal" style={{ height: 10 }} />
          <ScrollArea.Corner data-testid="corner" />
        </ScrollArea.Root>,
      );

      const corner = screen.getByTestId('corner');
      const style = getComputedStyle(corner);

      expect(style.getPropertyValue('--scroll-area-corner-width')).to.equal('10px');
      expect(style.getPropertyValue('--scroll-area-corner-height')).to.equal('10px');
    });
  });
});

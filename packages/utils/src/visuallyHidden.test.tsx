import { expect, describe, it } from 'vitest';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { isJSDOM } from './testUtils';
import { visuallyHidden } from './visuallyHidden';

describe.skipIf(isJSDOM)('visuallyHidden', () => {
  const { render } = createRenderer();

  it.each([
    ['ltr', 'ltr'],
    ['ltr', 'rtl'],
    ['rtl', 'ltr'],
    ['rtl', 'rtl'],
  ])(
    'does not overflow a %s scroller with %s content',
    async (scrollerDirection, contentDirection) => {
      await render(
        <div
          data-testid="scroller"
          dir={scrollerDirection}
          style={{ width: 100, height: 100, overflow: 'auto' }}
        >
          {/* Establish a fixed-position containing block below the scroller's top edge. */}
          <div dir={contentDirection} style={{ transform: 'translateY(20px)' }}>
            <input type="radio" style={visuallyHidden} />
          </div>
        </div>,
      );

      const scroller = screen.getByTestId('scroller');
      expect(scroller.scrollWidth).toBe(scroller.clientWidth);
    },
  );
});

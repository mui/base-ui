import { expect, describe, it } from 'vitest';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { isJSDOM } from './testUtils';
import { visuallyHidden, visuallyHiddenInputPinned } from './visuallyHidden';

describe.skipIf(isJSDOM)('visuallyHidden', () => {
  const { render } = createRenderer();

  describe.each([
    { name: 'visuallyHidden', style: visuallyHidden },
    { name: 'visuallyHiddenInputPinned', style: visuallyHiddenInputPinned },
  ])('$name', ({ style }) => {
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
              <input type="radio" style={style} />
            </div>
          </div>,
        );

        const scroller = screen.getByTestId('scroller');
        expect(scroller.scrollWidth).toBe(scroller.clientWidth);
      },
    );

    // Label clicks and native validation focus hidden inputs.
    it('does not scroll the page when focused', async ({ onTestFinished }) => {
      onTestFinished(() => window.scrollTo(0, 0));
      await render(
        <div style={{ paddingTop: 2000, height: 5000 }}>
          <input type="checkbox" data-testid="input" style={style} />
        </div>,
      );
      window.scrollTo(0, 1500);
      expect(window.scrollY).toBe(1500);

      screen.getByTestId('input').focus();
      expect(window.scrollY).toBe(1500);
    });
  });
});

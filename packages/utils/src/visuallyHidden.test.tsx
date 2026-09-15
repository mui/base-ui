import { expect, describe, it } from 'vitest';
import { createRenderer, screen } from '@mui/internal-test-utils';
import { isJSDOM } from './testUtils';
import { visuallyHidden } from './visuallyHidden';

describe.skipIf(isJSDOM)('visuallyHidden', () => {
  const { render } = createRenderer();

  it.each(['ltr', 'rtl'])('does not create horizontal overflow in %s', async (direction) => {
    await render(
      <div
        data-testid="scroller"
        dir={direction}
        style={{ width: 100, height: 100, overflow: 'auto' }}
      >
        {/* Establish a fixed-position containing block below the scroller's top edge. */}
        <div style={{ transform: 'translateY(20px)' }}>
          <input type="radio" style={visuallyHidden} />
        </div>
      </div>,
    );

    const scroller = screen.getByTestId('scroller');
    expect(scroller.scrollWidth).toBe(scroller.clientWidth);
  });
});

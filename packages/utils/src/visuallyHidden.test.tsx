import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { createRenderer } from '@mui/internal-test-utils';
import { isJSDOM } from './testUtils';
import { visuallyHidden, visuallyHiddenInput } from './visuallyHidden';

describe('visuallyHidden', () => {
  it('can be assigned directly to a CSSStyleDeclaration', () => {
    const element = document.createElement('div');

    Object.assign(element.style, visuallyHidden);

    expect(element.style.position).toBe('fixed');
    expect(element.style.width).toBe('1px');
    expect(element.style.height).toBe('1px');
    expect(element.style.margin).toBe('0px');
    expect(element.style.padding).toBe('0px');
    expect(element.style.borderWidth).toBe('0px');
    expect(element.style.top).toBe('0px');
    expect(element.style.left).toBe('0px');
  });

  it('remains compatible with React styles', () => {
    render(
      <React.Fragment>
        <span data-testid="hidden" style={visuallyHidden} />
        <input data-testid="hidden-input" style={visuallyHiddenInput} />
      </React.Fragment>,
    );

    expect(screen.getByTestId('hidden')).toHaveStyle({
      position: 'fixed',
      width: '1px',
      height: '1px',
      margin: '0px',
      top: '0px',
      left: '0px',
    });
    expect(screen.getByTestId('hidden-input')).toHaveStyle({
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
    });
  });
});

describe.skipIf(isJSDOM)('visuallyHidden overflow', () => {
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

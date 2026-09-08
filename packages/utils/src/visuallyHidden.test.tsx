import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { visuallyHidden, visuallyHiddenInput } from './visuallyHidden';

describe('visuallyHidden', () => {
  it('can be assigned directly to a CSSStyleDeclaration', () => {
    const element = document.createElement('div');

    Object.assign(element.style, visuallyHidden);

    expect(element.style.position).toBe('fixed');
    expect(element.style.width).toBe('1px');
    expect(element.style.height).toBe('1px');
    expect(element.style.margin).toBe('-1px');
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
      margin: '-1px',
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

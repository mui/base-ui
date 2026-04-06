import { expect } from 'vitest';
import * as React from 'react';
import { createRenderer } from '#test-utils';
import { screen } from '@mui/internal-test-utils';
import { InternalBackdrop } from './InternalBackdrop';

describe('InternalBackdrop', () => {
  const { render } = createRenderer();

  it('minifies the cutout clip-path polygon string', async () => {
    const cutout = document.createElement('button');

    Object.defineProperty(cutout, 'getBoundingClientRect', {
      configurable: true,
      value: () => ({
        left: 10,
        top: 20,
        right: 30,
        bottom: 40,
      }),
    });

    await render(<InternalBackdrop cutout={cutout} />);

    expect(screen.getByRole('presentation', { hidden: true }).getAttribute('style')).toContain(
      'clip-path: polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,10px 20px,10px 40px,30px 40px,30px 20px,10px 20px);',
    );
  });
});

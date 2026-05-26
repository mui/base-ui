import * as React from 'react';
import { createRenderer, describeConformance } from '#test-utils';
import * as Dropzone from './index.parts';

describe('Dropzone conformance', () => {
  const { render } = createRenderer();

  describeConformance(<Dropzone.Root>Drop files</Dropzone.Root>, () => ({
    render,
    refInstanceof: window.HTMLDivElement,
  }));

  describeConformance(<Dropzone.HiddenInput />, () => ({
    refInstanceof: window.HTMLInputElement,
    render(node) {
      return render(<Dropzone.Root>{node}</Dropzone.Root>);
    },
  }));
});

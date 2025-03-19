import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { useRenderElement } from './useRenderElement';

describe('useRenderElement', () => {
  const { render } = createRenderer();

  it('render props does not overwrite className in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: Parameters<typeof useRenderElement>[0]['render'];
      className?: Parameters<typeof useRenderElement>[0]['className'];
    }) {
      const renderElement = useRenderElement(props, {
        render: 'div',
        state: {},
      });
      return renderElement();
    }

    const { container } = await render(
      <TestComponent
        render={(props: any, state: any) => <span className="my-span" {...props} {...state} />}
      />,
    );

    const element = container.firstElementChild;

    expect(element).to.have.attribute('class', 'my-span');
  });
});

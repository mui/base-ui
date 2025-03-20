import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { useRenderElement } from './useRenderElement';
import { useRender } from '../use-render';

describe('useRenderElement', () => {
  const { render } = createRenderer();

  it('render props does not overwrite className in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: useRenderElement.ComponentProps<any>['render'];
      className?: useRenderElement.ComponentProps<any>['className'];
    }) {
      const renderElement = useRenderElement('div', props);
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

import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { useComponentRenderer, type ComponentRendererSettings } from './useComponentRenderer';

describe('useComponentRenderer', () => {
  const { render } = createRenderer();

  it('render props does not overwrite className in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: ComponentRendererSettings<any, Element>['render'];
      className?: ComponentRendererSettings<any, Element>['className'];
    }) {
      const { render: renderProp, className } = props;
      const { renderElement } = useComponentRenderer({
        render: renderProp,
        state: {},
        className,
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

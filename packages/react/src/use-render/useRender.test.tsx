import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { useRender } from '@base-ui-components/react/use-render';

describe('useRender', () => {
  const { render } = createRenderer();

  it('render props does not overwrite className in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: useRender.Settings<Element>['render'];
      className?: string;
    }) {
      const { render: renderProp, className } = props;
      const { renderElement } = useRender({
        render: renderProp,
        state: {},
        className,
      });
      return renderElement();
    }

    const { container } = await render(
      <TestComponent
        render={(props: any, state: any) => (
          <span {...props} className={`my-span ${props.className ?? ''}`} {...state} />
        )}
      />,
    );

    const element = container.firstElementChild;

    expect(element).to.have.attribute('class', 'my-span ');
  });
});

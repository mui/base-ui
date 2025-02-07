import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { useRenderer } from '@base-ui-components/react/use-renderer';

describe('useRenderer', () => {
  const { render } = createRenderer();

  it('render props does not overwrite className in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: useRenderer.Settings<any, Element>['render'];
      className?: useRenderer.Settings<any, Element>['className'];
    }) {
      const { render: renderProp, className } = props;
      const { renderElement } = useRenderer({
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

  it('includes data-attributes for all state members', async () => {
    function TestComponent(props: {
      render?: useRenderer.Settings<any, Element>['render'];
      className?: useRenderer.Settings<any, Element>['className'];
      size: 'small' | 'medium' | 'large';
      weight: 'light' | 'regular' | 'bold';
    }) {
      const { render: renderProp, size, weight } = props;
      const { renderElement } = useRenderer({
        render: renderProp ?? 'span',
        state: {
          size,
          weight,
        },
      });
      return renderElement();
    }

    const { container } = await render(<TestComponent size="large" weight="bold" />);

    const element = container.firstElementChild;

    expect(element).to.have.attribute('data-size', 'large');
    expect(element).to.have.attribute('data-weight', 'bold');
  });

  it('respects the customStyleHookMapping config if provided', async () => {
    function TestComponent(props: {
      render?: useRenderer.Settings<any, Element>['render'];
      className?: useRenderer.Settings<any, Element>['className'];
      size: 'small' | 'medium' | 'large';
      weight: 'light' | 'regular' | 'bold';
    }) {
      const { render: renderProp, size, weight } = props;
      const { renderElement } = useRenderer({
        render: renderProp ?? 'span',
        state: {
          size,
          weight,
        },
        styleHookMapping: {
          size(value) {
            return { [`data-size${value}`]: '' };
          },
          weight() {
            return null;
          },
        },
      });
      return renderElement();
    }

    const { container } = await render(<TestComponent size="large" weight="bold" />);

    const element = container.firstElementChild;

    expect(element).to.have.attribute('data-sizelarge', '');
    expect(element).not.to.have.attribute('data-weight');
  });
});

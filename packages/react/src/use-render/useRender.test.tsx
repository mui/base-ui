import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { useRender } from '@base-ui-components/react/use-render';

describe('useRender', () => {
  const { render } = createRenderer();

  it('render props does not overwrite className in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: useRender.Parameters<{}, Element, undefined>['render'];
      className?: string;
    }) {
      const { render: renderProp, className } = props;
      const element = useRender({
        render: renderProp,
        props: {
          className,
        },
      });
      return element;
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

  it('refs are handled as expected', async () => {
    const refs: React.Ref<HTMLElement | undefined>[] = [];

    function TestComponent(
      props: {
        render: useRender.Parameters<{}, Element, undefined>['render'];
        className?: string;
      } & React.ComponentPropsWithRef<'span'>,
    ) {
      const { render: renderProp, ...otherProps } = props;
      const ref1 = React.useRef<HTMLElement>(null);
      const ref2 = React.useRef<HTMLElement>(null);

      React.useEffect(() => {
        refs[0] = ref1;
        refs[1] = ref2;
      }, []);

      const element = useRender({
        render: renderProp,
        ref: [ref1, ref2],
        props: otherProps,
      });
      return element;
    }

    const { container } = await render(
      <TestComponent render={(props: any, state: any) => <span {...props} {...state} />} />,
    );
    expect(refs.length).to.equal(2);

    refs.forEach((ref) => {
      expect(ref).to.deep.equal({ current: container.firstElementChild });
    });
  });

  describe('dataset', () => {
    it('applies dataset attributes to the rendered element', async () => {
      function TestComponent() {
        const element = useRender({
          render: <button />,
          dataset: {
            'data-testid': 'submit-button',
            'data-active': true,
            'data-index': 42,
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const button = container.firstElementChild;

      expect(button).to.have.attribute('data-testid', 'submit-button');
      expect(button).to.have.attribute('data-active', 'true');
      expect(button).to.have.attribute('data-index', '42');
    });

    it('handles undefined values in dataset', async () => {
      function TestComponent() {
        const element = useRender({
          render: <div />,
          dataset: {
            'data-defined': 'value',
            'data-undefined': undefined,
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const div = container.firstElementChild;

      expect(div).to.have.attribute('data-defined', 'value');
      expect(div).not.to.have.attribute('data-undefined');
    });

    it('merges dataset with existing props', async () => {
      function TestComponent() {
        const element = useRender({
          render: <button />,
          dataset: {
            'data-testid': 'my-button',
            'data-form': 'login',
          },
          props: {
            className: 'btn-primary',
            id: 'submit-btn',
            'data-existing': 'prop',
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const button = container.firstElementChild;

      expect(button).to.have.attribute('data-testid', 'my-button');
      expect(button).to.have.attribute('data-form', 'login');

      expect(button).to.have.attribute('class', 'btn-primary');
      expect(button).to.have.attribute('id', 'submit-btn');

      expect(button).to.have.attribute('data-existing', 'prop');
    });

    it('dataset overrides data attributes from props', async () => {
      function TestComponent() {
        const element = useRender({
          render: <button />,
          dataset: {
            'data-testid': 'from-dataset',
          },
          props: {
            'data-testid': 'from-props',
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const button = container.firstElementChild;

      expect(button).to.have.attribute('data-testid', 'from-dataset');
    });

    it('handles empty dataset', async () => {
      function TestComponent() {
        const element = useRender({
          render: <span />,
          dataset: {},
          props: {
            className: 'test-class',
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const span = container.firstElementChild;

      expect(span).to.have.attribute('class', 'test-class');

      const attributes = span?.attributes;
      if (attributes) {
        for (let i = 0; i < attributes.length; i += 1) {
          expect(attributes[i].name).not.to.match(/^data-/);
        }
      }
    });

    it('handles undefined dataset', async () => {
      function TestComponent() {
        const element = useRender({
          render: <div />,
          dataset: undefined,
          props: {
            className: 'test-class',
            'data-from-props': 'value',
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const div = container.firstElementChild;

      expect(div).to.have.attribute('class', 'test-class');
      expect(div).to.have.attribute('data-from-props', 'value');
    });

    it('converts boolean values to string in dataset', async () => {
      function TestComponent() {
        const element = useRender({
          render: <button />,
          dataset: {
            'data-active': true,
            'data-disabled': false,
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const button = container.firstElementChild;

      expect(button).to.have.attribute('data-active', 'true');
      expect(button).to.have.attribute('data-disabled', 'false');
    });

    it('converts number values to string in dataset', async () => {
      function TestComponent() {
        const element = useRender({
          render: <div />,
          dataset: {
            'data-count': 0,
            'data-index': 42,
            'data-percentage': 99.9,
          },
        });
        return element;
      }

      const { container } = await render(<TestComponent />);
      const div = container.firstElementChild;

      expect(div).to.have.attribute('data-count', '0');
      expect(div).to.have.attribute('data-index', '42');
      expect(div).to.have.attribute('data-percentage', '99.9');
    });
  });
});

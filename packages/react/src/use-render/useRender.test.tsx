import * as React from 'react';
import { expect } from 'chai';
import { createRenderer } from '@mui/internal-test-utils';
import { useRender } from '@base-ui-components/react/use-render';

describe('useRender', () => {
  const { render } = createRenderer();

  it('render props does not overwrite className in a render function when unspecified', async () => {
    function TestComponent(props: {
      render: useRender.Settings<{}, Element>['render'];
      className?: string;
    }) {
      const { render: renderProp, className } = props;
      const { renderElement } = useRender({
        render: renderProp,
        props: {
          className,
        },
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

  it('refs are handled as expected', async () => {
    const refs: React.Ref<HTMLElement | undefined>[] = [];

    function TestComponent(
      props: {
        render: useRender.Settings<{}, Element>['render'];
        className?: string;
      } & React.ComponentPropsWithRef<'span'>,
    ) {
      const { render: renderProp, ...otherProps } = props;
      const ref1 = React.useRef<HTMLElement>(null);
      const ref2 = React.useRef<HTMLElement>(null);

      React.useEffect(() => {
        refs.push(ref1);
        refs.push(ref2);
      }, []);

      const { renderElement } = useRender({
        render: renderProp,
        refs: [ref1, ref2],
        props: otherProps,
      });
      return renderElement();
    }

    const WrapperComponent = () => {
      const ref = React.useRef<HTMLElement>(null);
      React.useEffect(() => {
        refs.push(ref);
      }, []);
      return (
        <TestComponent
          ref={ref}
          render={(props: any, state: any) => <span {...props} {...state} />}
        />
      );
    };

    const { container } = await render(<WrapperComponent />);

    expect(refs.length).to.equal(3);

    refs.map((ref) => {
      expect(ref).to.deep.equal({ current: container.firstElementChild });
    });
  });
});

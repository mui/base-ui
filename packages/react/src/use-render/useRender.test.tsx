import * as React from 'react';
import { expect } from 'chai';
import { useRender } from '@base-ui-components/react/use-render';
import { createRenderer } from '#test-utils';

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

  describe('param: defaultTag', () => {
    it('renders the element with the default tag with no render prop', async () => {
      function TestComponent({ defaultTag }: { defaultTag: keyof React.JSX.IntrinsicElements }) {
        return useRender({ defaultTag });
      }

      const { container, setProps } = await render(<TestComponent defaultTag="div" />);
      expect(container.firstElementChild).to.have.property('tagName', 'DIV');

      await setProps({ defaultTag: 'span' });
      expect(container.firstElementChild).to.have.property('tagName', 'SPAN');
    });

    it('is overwritten by the render prop', async () => {
      function TestComponent({
        render: renderProp,
        defaultTag,
      }: {
        render: useRender.Parameters<{}, Element, undefined>['render'];
        defaultTag: keyof React.JSX.IntrinsicElements;
      }) {
        return useRender({ render: renderProp, defaultTag });
      }

      const { container, setProps } = await render(
        <TestComponent defaultTag="div" render={<span />} />,
      );
      expect(container.firstElementChild).to.have.property('tagName', 'SPAN');

      await setProps({ defaultTag: 'a' });
      expect(container.firstElementChild).to.have.property('tagName', 'SPAN');
    });
  });
});

import * as React from 'react';
import { expect } from 'chai';
import { createRenderer, MuiRenderResult, screen } from '@mui/internal-test-utils';
import { useForkRef } from './useForkRef';
import { getReactElementRef } from './getReactElementRef';

describe('useForkRef', () => {
  const { render } = createRenderer();

  it('returns a single ref-setter function that forks the ref to its inputs', () => {
    interface TestComponentProps {
      innerRef: React.Ref<HTMLDivElement | null>;
    }

    function Component(props: TestComponentProps) {
      const { innerRef } = props;
      const [ownRefCurrent, ownRef] = React.useState<HTMLDivElement | null>(null);

      const handleRef = useForkRef(innerRef, ownRef);

      return <div ref={handleRef}>{ownRefCurrent ? 'has a ref' : 'has no ref'}</div>;
    }

    const outerRef = React.createRef<HTMLDivElement>();

    expect(() => {
      render(<Component innerRef={outerRef} />);
    }).not.toErrorDev();
    expect(outerRef.current!.textContent).to.equal('has a ref');
  });

  it('forks if only one of the branches requires a ref', () => {
    const Component = React.forwardRef(function Component(props, ref) {
      const [hasRef, setHasRef] = React.useState(false);
      const handleOwnRef = React.useCallback(() => setHasRef(true), []);
      const handleRef = useForkRef(handleOwnRef, ref);

      return (
        <div ref={handleRef} data-testid="hasRef">
          {String(hasRef)}
        </div>
      );
    });

    expect(() => {
      render(<Component />);
    }).not.toErrorDev();

    expect(screen.getByTestId('hasRef')).to.have.text('true');
  });

  it('does nothing if none of the forked branches requires a ref', () => {
    interface TestComponentProps {
      children: React.ReactElement<any>;
    }

    const Outer = React.forwardRef<HTMLDivElement, TestComponentProps>(function Outer(props, ref) {
      const { children } = props;
      const handleRef = useForkRef(getReactElementRef(children), ref);

      return React.cloneElement(children, { ref: handleRef });
    });

    function Inner() {
      return <div />;
    }

    expect(() => {
      render(
        <Outer>
          <Inner />
        </Outer>,
      );
    }).not.toErrorDev();
  });

  describe('changing refs', () => {
    interface TestComponentProps {
      leftRef?: React.Ref<HTMLDivElement | null>;
      rightRef?: React.Ref<HTMLDivElement | null>;
      id?: string;
    }

    function Div(props: TestComponentProps) {
      const { leftRef, rightRef, ...other } = props;
      const handleRef = useForkRef(leftRef, rightRef);

      return <div {...other} ref={handleRef} />;
    }

    it('handles changing from no ref to some ref', () => {
      let view: MuiRenderResult;

      expect(() => {
        view = render(<Div id="test" />);
      }).not.toErrorDev();

      const ref = React.createRef<HTMLDivElement>();
      expect(() => {
        view.setProps({ leftRef: ref });
      }).not.toErrorDev();
      expect(ref.current!.id).to.equal('test');
    });

    it('cleans up detached refs', () => {
      const firstLeftRef = React.createRef<HTMLDivElement>();
      const firstRightRef = React.createRef<HTMLDivElement>();
      const secondRightRef = React.createRef<HTMLDivElement>();
      let view: MuiRenderResult;

      expect(() => {
        view = render(<Div leftRef={firstLeftRef} rightRef={firstRightRef} id="test" />);
      }).not.toErrorDev();

      expect(firstLeftRef.current!.id).to.equal('test');
      expect(firstRightRef.current!.id).to.equal('test');
      expect(secondRightRef.current).to.equal(null);

      view!.setProps({ rightRef: secondRightRef });

      expect(firstLeftRef.current!.id).to.equal('test');
      expect(firstRightRef.current).to.equal(null);
      expect(secondRightRef.current!.id).to.equal('test');
    });
  });
});

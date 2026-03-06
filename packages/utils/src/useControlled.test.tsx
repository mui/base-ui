import * as React from 'react';
import { expect } from 'chai';
import { act, createRenderer } from '@mui/internal-test-utils';
import { useControlled } from './useControlled';

interface TestComponentChildrenArgument {
  value: number | string;
  setValue: React.Dispatch<React.SetStateAction<number | string>>;
}

interface TestComponentProps {
  value?: number | string;
  defaultValue?: number | string;
  children: (parames: TestComponentChildrenArgument) => React.ReactNode;
}

function TestComponent({ value: valueProp, defaultValue, children }: TestComponentProps) {
  const [value, setValue] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'TestComponent',
  });
  return children({ value, setValue });
}

describe('useControlled', () => {
  const { render } = createRenderer();

  it('works correctly when is not controlled', () => {
    let valueState;
    let setValueState: React.Dispatch<React.SetStateAction<number | string>>;
    render(
      <TestComponent defaultValue={1}>
        {({ value, setValue }) => {
          valueState = value;
          setValueState = setValue;
          return null;
        }}
      </TestComponent>,
    );
    expect(valueState).to.equal(1);

    act(() => {
      setValueState(2);
    });

    expect(valueState).to.equal(2);
  });

  it('works correctly when is controlled', () => {
    let valueState;
    render(
      <TestComponent value={1}>
        {({ value }) => {
          valueState = value;
          return null;
        }}
      </TestComponent>,
    );
    expect(valueState).to.equal(1);
  });

  it('warns when switching from uncontrolled to controlled', () => {
    let setProps: (newProps: any) => void;
    expect(() => {
      ({ setProps } = render(<TestComponent>{() => null}</TestComponent>));
    }).not.toErrorDev();

    expect(() => {
      setProps({ value: 'foobar' });
    }).toErrorDev(
      'Base UI: A component is changing the uncontrolled value state of TestComponent to be controlled.',
    );
  });

  it('should warn when switching from controlled to uncontrolled', () => {
    let setProps: (newProps: any) => void;

    expect(() => {
      ({ setProps } = render(<TestComponent value="foobar">{() => null}</TestComponent>));
    }).not.toErrorDev();

    expect(() => {
      setProps({ value: undefined });
    }).toErrorDev(
      'Base UI: A component is changing the controlled value state of TestComponent to be uncontrolled.',
    );
  });

  describe('prop: defaultValue', () => {
    it('warns when changed after initial rendering', () => {
      let setProps: (newProps: any) => void;

      expect(() => {
        ({ setProps } = render(<TestComponent>{() => null}</TestComponent>));
      }).not.toErrorDev();

      expect(() => {
        setProps({ defaultValue: 1 });
      }).toErrorDev(
        'Base UI: A component is changing the default value state of an uncontrolled TestComponent after being initialized.',
      );
    });

    it('does not warn when controlled', () => {
      let setProps: (newProps: any) => void;

      expect(() => {
        ({ setProps } = render(
          <TestComponent value={1} defaultValue={0}>
            {() => null}
          </TestComponent>,
        ));
      }).not.toErrorDev();

      expect(() => {
        setProps({ defaultValue: 1 });
      }).not.toErrorDev();
    });

    it('does not warn when NaN', () => {
      expect(() => {
        render(<TestComponent defaultValue={NaN}>{() => null}</TestComponent>);
      }).not.toErrorDev();
    });

    it('does not warn when an array', () => {
      function TestComponentArray() {
        useControlled({
          controlled: undefined,
          default: [],
          name: 'TestComponent',
        });
        return null;
      }

      expect(() => {
        render(<TestComponentArray />);
      }).not.toErrorDev();
    });
  });
});

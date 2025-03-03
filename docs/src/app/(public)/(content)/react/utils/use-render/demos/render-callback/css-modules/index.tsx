'use client';
import * as React from 'react';
import { useRender } from '@base-ui-components/react/use-render';
import styles from './index.module.css';

type CounterState = {
  odd: boolean;
};

type CounterProps = {
  className?: string;
  render?: useRender.RenderProp<CounterState>;
  onClick?: (event: React.MouseEvent) => void;
  ['aria-label']?: string;
};

function Counter(props: CounterProps) {
  const {
    render = <button />,
    className,
    onClick,
    'aria-label': ariaLabel,
    ...otherProps
  } = props;
  const [count, setCount] = React.useState(0);
  const odd = count % 2 === 1;
  const state = React.useMemo(() => ({ odd }), [odd]);

  const handleClick = (event: React.MouseEvent) => {
    setCount((prev) => prev + 1);
    onClick?.(event);
  };

  const { renderElement } = useRender({
    render,
    state,
    props: {
      className: `${styles.Button} ${className ?? ''}`,
      type: 'button',
      children: (
        <React.Fragment>
          Counter: <span>{count}</span>
        </React.Fragment>
      ),
      onClick: handleClick,
      'aria-label': `Count is ${count}, click to increase.` ?? ariaLabel,
      ...otherProps,
    },
  });

  return renderElement();
}

export default function ExampleCounter() {
  return (
    <Counter
      render={(props, state) => (
        <button {...props}>
          {props.children}
          <span className={styles.suffix}>{state.odd ? '👎' : '👍'}</span>
        </button>
      )}
    />
  );
}

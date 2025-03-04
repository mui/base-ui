'use client';
import * as React from 'react';
import { useRender } from '@base-ui-components/react/use-render';
import { mergeProps } from '@base-ui-components/react/merge-props';
import styles from './index.module.css';

type CounterState = {
  odd: boolean;
};

interface CounterProps extends useRender.ElementProps<CounterState> {
  className?: string;
  onClick?: (event: React.MouseEvent) => void;
  ['aria-label']?: string;
}

function Counter(props: CounterProps) {
  const { render = <button />, ...otherProps } = props;
  const [count, setCount] = React.useState(0);
  const odd = count % 2 === 1;
  const state = React.useMemo(() => ({ odd }), [odd]);

  const { renderElement } = useRender({
    render,
    state,
    props: mergeProps(
      {
        className: styles.Button,
        type: 'button',
        children: (
          <React.Fragment>
            Counter: <span>{count}</span>
          </React.Fragment>
        ),
        onClick: () => setCount((prev) => prev + 1),
        'aria-label': `Count is ${count}, click to increase.`,
      },
      otherProps,
    ),
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

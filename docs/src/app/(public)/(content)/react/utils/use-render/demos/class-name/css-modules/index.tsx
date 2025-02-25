'use client';
import * as React from 'react';
import { useRender } from '@base-ui-components/react/use-render';
import styles from './index.module.css';

type CounterState = {
  odd: boolean;
};

type CounterProps = {
  className?: string | ((state: CounterState) => string);
  render?: useRender.RenderProp<CounterState>;
};

function Counter(props: CounterProps) {
  const { render, className, ...otherProps } = props;
  const [count, setCount] = React.useState(0);
  const odd = count % 2 === 1;
  const state = React.useMemo(() => ({ odd }), [odd]);

  const { renderElement } = useRender({
    render: render ?? <button type="button" />,
    state,
    className,
    props: {
      ...otherProps,
      type: 'button',
      children: (
        <React.Fragment>
          Counter: <span>{count}</span>
        </React.Fragment>
      ),
      onClick: () => setCount((prev) => prev + 1),
      'aria-label': `Count is ${count}, click to increase`,
    },
  });

  return renderElement();
}

export default function ExampleCounter() {
  return (
    <Counter
      className={(state) =>
        state.odd ? `${styles.Button} ${styles.odd}` : styles.Button
      }
    />
  );
}

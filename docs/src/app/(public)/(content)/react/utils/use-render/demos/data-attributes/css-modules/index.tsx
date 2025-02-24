'use client';
import * as React from 'react';
import { useRender } from '@base-ui-components/react/use-render';
import styles from './index.module.css';

type Size = 'small' | 'medium' | 'large';

type TextState = {
  size: Size;
};

type TextProps = {
  className?: string | ((state: TextState) => string);
  render?: useRender.RenderProp<TextState>;
  size?: Size;
  children: React.ReactNode;
};

function Text(props: TextProps) {
  const { className, render, size = 'medium', ...otherProps } = props;

  const state = React.useMemo(() => ({ size }), [size]);

  const { renderElement } = useRender({
    render: render ?? <p />,
    state,
    className,
    props: { ...otherProps, className: styles.Text },
  });

  return renderElement();
}

export default function ExampleText() {
  return (
    <div>
      <Text size="small">Small size</Text>
      <Text size="medium">Medium size</Text>
      <Text size="large">Large size</Text>
    </div>
  );
}

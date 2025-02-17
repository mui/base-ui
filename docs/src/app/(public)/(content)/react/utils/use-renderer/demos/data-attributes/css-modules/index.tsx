'use client';
import * as React from 'react';
import { useRenderer } from '@base-ui-components/react/use-renderer';
import styles from './index.module.css';

type Size = 'small' | 'medium' | 'large';
type Color = 'default' | 'active';

type TextState = {
  size: Size;
  color: Color;
};

type TextProps = {
  className: string | ((state: TextState) => string);
  render?: useRenderer.RenderProp<TextState>;
  onClick?: (event: React.MouseEvent<Element>) => void;
  children: React.ReactNode;
  size?: Size;
};

function Text(props: TextProps) {
  const { className, render, size = 'medium', onClick, ...otherProps } = props;
  const [color, setColor] = React.useState<Color>('default');

  const onClickHandler = (event: React.MouseEvent<Element>) => {
    setColor(color === 'default' ? 'active' : 'default');
    onClick?.(event);
  };

  const state = React.useMemo(() => ({ size, color }), [size, color]);

  const { renderElement } = useRenderer({
    render: render ?? <p />,
    state,
    className,
    props: {
      ...otherProps,
      onClick: onClickHandler,
    },
  });

  return renderElement();
}

export default function ExampleText() {
  return (
    <div>
      <Text className={styles.Text} size="small">
        Small size
      </Text>
      <Text className={styles.Text}>Medium size</Text>
      <Text className={styles.Text} size="large">
        Large size
      </Text>
    </div>
  );
}

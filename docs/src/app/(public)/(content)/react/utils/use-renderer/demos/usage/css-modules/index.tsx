'use client';
import * as React from 'react';
import { useRenderer, RenderProp } from '@base-ui-components/react/use-renderer';
import styles from './index.module.css';

type Weight = 'light' | 'regular' | 'bold';
type Size = 'small' | 'medium' | 'large';
type Color = 'grey' | 'blue';

type TextState = {
  weight: Weight;
  size: Size;
  color: Color;
};

type TextProps = {
  className: string | ((state: TextState) => string);
  weight?: Weight;
  render?: RenderProp<TextState>;
  onClick?: (event: React.MouseEvent<Element>) => void;
  children: React.ReactNode;
  size?: Size;
};

function Text(props: TextProps) {
  const {
    className,
    render,
    weight = 'regular',
    size = 'medium',
    onClick,
    ...otherProps
  } = props;
  const [color, setColor] = React.useState<Color>('grey');

  const onClickHandler = (event: React.MouseEvent<Element>) => {
    setColor(color === 'grey' ? 'blue' : 'grey');
    onClick?.(event);
  };

  const state = React.useMemo(
    () => ({ weight, size, color }),
    [weight, size, color],
  );

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
        Small text
      </Text>
      <Text className={styles.Text}>Default text</Text>
      <Text className={styles.Text} size="large">
        Large text
      </Text>
      <Text className={styles.Text} weight="bold" render={<strong />}>
        Bold text rendered in a strong tag
      </Text>
    </div>
  );
}

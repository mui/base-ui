'use client';
import * as React from 'react';
import { useRenderer, RenderProp } from '@base-ui-components/react/use-renderer';
import styles from './index.module.css';

type Weight = 'light' | 'regular' | 'bold';
type Size = 'small' | 'medium' | 'large';

type TextState = {
  weight: Weight;
  size: Size;
};

type TextProps = {
  className: string | ((state: TextState) => string);
  weight?: Weight;
  render?: RenderProp<TextState>;
  children: React.ReactNode;
  style?: React.CSSProperties;
  size?: Size;
  excludedProp?: boolean;
};

const Text = React.forwardRef(
  (props: TextProps, forwardedRef: React.ForwardedRef<HTMLElement>) => {
    const {
      className,
      render,
      style = {},
      weight = 'regular',
      size = 'medium',
      ...otherProps
    } = props;

    const fontWeight = {
      light: 300,
      regular: 400,
      bold: 700,
    }[weight];

    const state = React.useMemo(() => ({ weight, size }), [weight, size]);

    const { renderElement } = useRenderer({
      render: render ?? <p />,
      state,
      className,
      ref: forwardedRef,
      props: {
        ...otherProps,
        style: {
          ...style,
          fontWeight,
        },
      },
    });

    return renderElement();
  },
);

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

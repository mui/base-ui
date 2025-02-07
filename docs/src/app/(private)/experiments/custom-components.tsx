'use client';
import * as React from 'react';
import { useRenderer, RenderProp } from '@base-ui-components/react/use-renderer';
import styles from './custom-components.module.css';

type Weight = 'light' | 'regular' | 'bold';
type Size = 'small' | 'medium' | 'large';

type TextState = {
  weight: Weight;
  size: Size;
  excludedProp: boolean;
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
      // Example state prop that we exclude from the style hooks
      excludedProp = true,
      ...otherProps
    } = props;

    const fontWeight = {
      light: 300,
      regular: 400,
      bold: 700,
    }[weight];

    const state = React.useMemo(
      () => ({ weight, size, excludedProp }),
      [weight, size, excludedProp],
    );

    const { renderElement } = useRenderer({
      render: render ?? 'p',
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
      styleHookMapping: {
        excludedProp() {
          return null;
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
        Large text in bold
      </Text>
      <Text className={styles.Text} render={<strong />} weight="bold">
        Text in bold
      </Text>
    </div>
  );
}

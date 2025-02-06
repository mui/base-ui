'use client';
import * as React from 'react';
import { useRenderer } from '@base-ui-components/react/use-renderer';
import styles from './custom-components.module.css';

type TextProps = {
  weight?: 'light' | 'regular' | 'bold';
  className: any;
  render?: any;
  children: any;
  style?: any;
  size?: 'small' | 'medium' | 'large';
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
      customStyleHookMapping: {
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

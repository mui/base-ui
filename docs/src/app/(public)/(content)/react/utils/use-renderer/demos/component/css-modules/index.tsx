'use client';
import * as React from 'react';
// Ignore the import, it will be moved to the Slot component
import { RenderProp } from '@base-ui-components/react/use-renderer';
import { Slot } from '@base-ui-components/react/slot';
import styles from './index.module.css';

type Weight = 'light' | 'regular' | 'bold';
type Size = 'small' | 'medium' | 'large';

type TextProps = {
  className?: string | ((state: Record<string, any>) => string);
  weight?: Weight;
  render?: RenderProp<Record<string, any>>;
  children: React.ReactNode;
  style?: React.CSSProperties;
  size?: Size;
  excludedProp?: boolean;
};

function Text(props: TextProps) {
  const { render, weight = 'regular', size = 'medium', ...otherProps } = props;

  const state = React.useMemo(() => ({ weight, size }), [weight, size]);

  return <Slot render={render ?? <p />} state={state} {...otherProps} />;
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

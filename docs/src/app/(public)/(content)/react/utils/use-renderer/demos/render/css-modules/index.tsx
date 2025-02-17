'use client';
import * as React from 'react';
import { useRenderer } from '@base-ui-components/react/use-renderer';
import styles from './index.module.css';

type TextProps = {
  className?: string;
  render?: useRenderer.RenderProp<Record<string, any>>;
  children: React.ReactNode;
};

function Text(props: TextProps) {
  const { render, ...otherProps } = props;

  const { renderElement } = useRenderer({
    render: render ?? <p />,
    props: otherProps,
  });

  return renderElement();
}

export default function ExampleText() {
  return (
    <div>
      <Text className={styles.Text}>Text component rendered as a paragraph tag</Text>
      <Text className={styles.Text} render={<strong />}>
        Text component rendered as a strong tag
      </Text>
    </div>
  );
}

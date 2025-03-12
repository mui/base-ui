'use client';
import * as React from 'react';
import { useRender } from '@base-ui-components/react/use-render';
import { mergeProps } from '@base-ui-components/react/merge-props';
import styles from './index.module.css';

// ElementProps contains the 'render' prop type
interface TextProps extends useRender.ElementProps<'p'> {
  children: React.ReactNode;
}

function Text(props: TextProps) {
  const { render = <p />, ref, ...otherProps } = props;

  const { renderElement } = useRender({
    render,
    props: {
      ref,
      ...mergeProps({ className: styles.Text }, otherProps),
    },
  });

  return renderElement();
}

export default function ExampleText() {
  return (
    <div>
      <Text>Text component rendered as a paragraph tag</Text>
      <Text render={<strong />}>Text component rendered as a strong tag</Text>
    </div>
  );
}

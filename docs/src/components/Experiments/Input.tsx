import * as React from 'react';
import clsx from 'clsx';
import { Input as BaseInput } from '@base-ui-components/react/input';
import styles from './Input.module.css';

export function Input(props: BaseInput.Props) {
  return <BaseInput {...props} className={clsx(styles.input, props.className)} />;
}

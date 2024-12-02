import * as React from 'react';
import { TextInput } from '@base-ui-components/react/text-input';
import styles from './index.module.css';

export default function ExampleTextInput() {
  return <TextInput placeholder="Name" className={styles.Input} />;
}

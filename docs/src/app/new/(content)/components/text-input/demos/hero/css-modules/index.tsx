import * as React from 'react';
import { Input } from '@base-ui-components/react/input';
import styles from './index.module.css';

export default function ExampleTextInput() {
  return <Input placeholder="Name" className={styles.Input} />;
}

import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { ToggleGroup } from '@base-ui-components/react/toggle-group';
import { Toggle } from '@base-ui-components/react/toggle';
import styles from './index.module.css';

export default function ExampleToolbar() {
  return (
    <Toolbar.Root className={styles.Toolbar}>
      <ToggleGroup className={styles.Group} aria-label="Formatting">
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Format automatically"
          value="auto"
          className={styles.Button}
        >
          Auto
        </Toolbar.Button>
        <Toolbar.Button
          render={<Toggle />}
          aria-label="Format as plain text"
          value="text"
          className={styles.Button}
        >
          Text
        </Toolbar.Button>
      </ToggleGroup>
      <Toolbar.Separator className={styles.Separator} />
      <Toolbar.Group className={styles.Group} aria-label="Numerical format">
        <Toolbar.Button className={styles.Button} aria-label="Format as currency">
          $
        </Toolbar.Button>
        <Toolbar.Button className={styles.Button} aria-label="Format as percent">
          %
        </Toolbar.Button>
      </Toolbar.Group>
      <Toolbar.Separator className={styles.Separator} />
      <Toolbar.Link className={styles.Link} href="#">
        Edited 51m ago
      </Toolbar.Link>
    </Toolbar.Root>
  );
}

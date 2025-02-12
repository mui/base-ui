'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import toolbarClasses from './toolbar.module.css';
import inputClasses from '../../../(public)/(content)/react/components/input/demos/hero/css-modules/index.module.css';
import '../../../../demo-theme.css';

const DISABLED = false;

const styles = {
  toolbar: toolbarClasses,
  input: inputClasses,
};

const TEXT = `Shows the basic anatomy:
- Toolbar.Root
- Toolbar.Button
- Toolbar.Link
- Toolbar.Input
- Toolbar.Separator
- Toolbar.Group
`;

export default function App() {
  return (
    <React.Fragment>
      <a
        className={styles.toolbar.a}
        href="https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/"
        target="_blank"
        rel="noreferrer"
      >
        <h3 className={styles.toolbar.h3}>Toolbar pattern</h3>
      </a>
      <div className={styles.toolbar.Wrapper}>
        <Toolbar.Root className={styles.toolbar.Root}>
          <Toolbar.Button
            disabled={DISABLED}
            className={styles.toolbar.Button}
            onClick={() => console.log('clicked a regular toolbar button')}
          >
            Button 1
          </Toolbar.Button>

          <Toolbar.Link
            className={styles.toolbar.Button}
            href="https://base-ui.com"
            target="_blank"
          >
            Link
          </Toolbar.Link>

          <Toolbar.Separator className={styles.toolbar.Separator} />

          <Toolbar.Group className={styles.toolbar.ToggleGroup}>
            <Toolbar.Button
              disabled={DISABLED}
              className={styles.toolbar.Button}
              onClick={() => console.log('clicked button 1 inside a group')}
              style={{ marginRight: '0.5rem' }}
            >
              Grouped Button 1
            </Toolbar.Button>

            <Toolbar.Button
              disabled={DISABLED}
              className={styles.toolbar.Button}
              onClick={() => console.log('clicked button 2 inside a group')}
            >
              Grouped Button 2
            </Toolbar.Button>
          </Toolbar.Group>

          <Toolbar.Input className={styles.input.Input} defaultValue="A textbox" />
        </Toolbar.Root>
        <textarea
          className={styles.toolbar.Textarea}
          name=""
          id=""
          rows={8}
          defaultValue={TEXT}
        />
      </div>
    </React.Fragment>
  );
}

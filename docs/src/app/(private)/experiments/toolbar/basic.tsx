'use client';
import * as React from 'react';
import { Toolbar } from '@base-ui-components/react/toolbar';
import { DirectionProvider } from '@base-ui-components/react/direction-provider';
import toolbarClasses from './toolbar.module.css';
import inputClasses from '../../../(public)/(content)/react/components/input/demos/hero/css-modules/index.module.css';
import '../../../../demo-theme.css';

import {
  SettingsMetadata,
  useExperimentSettings,
} from '../../../../components/Experiments/SettingsPanel';

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

interface Settings extends Record<string, boolean> {}

export const settingsMetadata: SettingsMetadata<Settings> = {
  isRtl: {
    type: 'boolean',
    label: 'RTL',
    default: false,
  },
  toolbarDisabled: {
    type: 'boolean',
    label: 'Everything disabled',
    default: false,
  },
};

export default function App() {
  const { settings } = useExperimentSettings<Settings>();
  const dir = settings.isRtl ? 'rtl' : 'ltr';
  const inputDefaultValue = settings.isRtl ? 'نص نائب' : 'hello world';
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
      <div className={styles.toolbar.Wrapper} dir={dir}>
        <DirectionProvider direction={dir}>
          <Toolbar.Root
            className={styles.toolbar.Root}
            orientation="horizontal"
            disabled={settings.toolbarDisabled}
          >
            <Toolbar.Button
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
                className={styles.toolbar.Button}
                onClick={() => console.log('clicked button 1 inside a group')}
                style={{ marginRight: '0.5rem' }}
              >
                Grouped Button 1
              </Toolbar.Button>

              <Toolbar.Button
                className={styles.toolbar.Button}
                onClick={() => console.log('clicked button 2 inside a group')}
              >
                Grouped Button 2
              </Toolbar.Button>
            </Toolbar.Group>

            <Toolbar.Input
              className={styles.input.Input}
              defaultValue={inputDefaultValue}
            />
          </Toolbar.Root>
        </DirectionProvider>
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

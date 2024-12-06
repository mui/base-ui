'use client';
import * as React from 'react';
import { SelectIcon } from 'docs/src/icons/Select';
import { Menu } from '@base-ui-components/react/menu';
import classes from './DocsVersionSelector.module.css';

export interface DocumentationVersion {
  version: string;
  url: string;
}

export interface DocsVersionSelectorProps {
  versions: DocumentationVersion[];
  currentVersion: string;
}

export function DocsVersionSelector(props: DocsVersionSelectorProps) {
  const { versions, currentVersion } = props;

  return (
    <Menu.Root>
      <Menu.Trigger className={classes.trigger} aria-label="Select documentation version">
        {currentVersion}
        <span className={classes.adornment}>
          <SelectIcon />
        </span>
      </Menu.Trigger>
      <Menu.Positioner
        className={classes.positioner}
        side="bottom"
        align="start"
        sideOffset={5}
        positionMethod="fixed"
      >
        <Menu.Popup className={classes.popup}>
          {versions.map((version) => (
            <Menu.Item
              render={<a href={version.url}>{version.version}</a>}
              key={version.version}
              className={classes.item}
            >
              {version.version}
            </Menu.Item>
          ))}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Root>
  );
}

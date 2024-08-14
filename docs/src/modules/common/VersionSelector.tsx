'use client';

import * as React from 'react';
import { SelectIcon } from 'docs-base/src/icons/Select';
import * as Menu from '@base_ui/react/Menu';
import classes from './VersionSelector.module.css';

export interface DocumentationVersion {
  version: string;
  url: string;
}

export interface VersionSelectorProps {
  versions: DocumentationVersion[];
  currentVersion: string;
}

export function VersionSelector(props: VersionSelectorProps) {
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
        alignment="start"
        sideOffset={5}
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

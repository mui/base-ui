import * as React from 'react';
import { BaseUIIcon } from 'docs/src/icons/BaseUI';
import { GitHubIcon } from 'docs/src/icons/GitHub';
import { SettingsIcon } from 'docs/src/icons/Settings';
import { IconButton } from 'docs/src/design-system/IconButton';
import { IconLinkButton } from 'docs/src/design-system/IconLinkButton';
import packageJson from 'docs/package.json';
import { DocsVersionSelector } from './DocsVersionSelector';
import classes from './AppBar.module.css';

const currentVersion = packageJson.version;
const supportedVersions = [
  {
    version: currentVersion,
    url: '#',
  },
  {
    version: '@mui/base (legacy)',
    url: 'https://mui.com/base-ui/getting-started/',
  },
];

export function AppBar() {
  return (
    <header className={classes.root}>
      <div className={classes.primary}>
        <IconLinkButton useNextLink href="/" label="Base UI" size={3}>
          <BaseUIIcon />
        </IconLinkButton>
        <DocsVersionSelector currentVersion={currentVersion} versions={supportedVersions} />
      </div>
      <div className={classes.secondary}>
        <IconLinkButton
          href="https://github.com/mui/base-ui"
          target="_blank"
          label="GitHub"
          rel="noreferrer noopener"
          size={3}
        >
          <GitHubIcon />
        </IconLinkButton>
        <IconButton label="settings" size={3}>
          <SettingsIcon />
        </IconButton>
      </div>
    </header>
  );
}

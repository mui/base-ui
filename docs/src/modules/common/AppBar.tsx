import * as React from 'react';
import Link from 'next/link';
import { BaseUIIcon } from 'docs-base/src/icons/BaseUI';
import { GitHubIcon } from 'docs-base/src/icons/GitHub';
import { SettingsIcon } from 'docs-base/src/icons/Settings';
import { VersionSelector } from './VersionSelector';
import packageJson from '../../../../package.json';

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
    <header className="AppBar">
      <div className="d-f ai-center jc-sb">
        <div className="d-f ai-center g-2">
          <Link href="/" className="IconButton size-3" aria-label="Base UI">
            <BaseUIIcon />
          </Link>
          <VersionSelector currentVersion={currentVersion} versions={supportedVersions} />
        </div>
        <div className="d-f ai-center">
          <a
            href="https://github.com/mui/base-ui"
            className="IconButton size-3"
            target="_blank"
            aria-label="GitHub"
            rel="noreferrer noopener"
          >
            <GitHubIcon />
          </a>
          <button type="button" className="IconButton size-3" aria-label="settings">
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

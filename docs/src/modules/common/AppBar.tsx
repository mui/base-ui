import * as React from 'react';
import Link from 'next/link';
import { BaseUIIcon } from 'docs-base/src/icons/BaseUI';
import { GitHubIcon } from 'docs-base/src/icons/GitHub';
import { SettingsIcon } from 'docs-base/src/icons/Settings';
import { SelectIcon } from 'docs-base/src/icons/Select';

export function AppBar() {
  return (
    <header className="AppBar">
      <div className="d-f ai-center jc-sb">
        <div className="d-f ai-center g-2">
          <Link href="/" className="IconButton size-3">
            <BaseUIIcon />
          </Link>
          <div className="SelectRoot">
            <select className="SelectTrigger size-1">
              <option>v0.2.1-alpha</option>
              <option>This doesn&apos;t</option>
              <option>work yet</option>
            </select>

            <div className="SelectAdornment">
              <SelectIcon />
            </div>
          </div>
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

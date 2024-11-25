import * as React from 'react';
import NextLink from 'next/link';
import { GitHubIcon } from '../icons/GitHub';

export function Header() {
  return (
    <div className="Header">
      <NextLink href="/" className="HeaderLink text-base font-medium">
        Base UI
      </NextLink>
      <div className="flex gap-6">
        <span>v1.0.0-alpha.1</span>
        <a className="HeaderLink" href="https://github.com/mui/base-ui" rel="noopener">
          <GitHubIcon />
          GitHub
        </a>
      </div>
    </div>
  );
}

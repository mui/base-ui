import * as React from 'react';
import NextLink from 'next/link';
import { GitHubIcon } from 'docs/src/icons/GitHub';
import { HeaderHamburgerNav } from './HeaderHamburgerNav';

export function Header() {
  return (
    <div className="Header">
      <NextLink href="/" className="HeaderLink text-base font-medium">
        Base UI
      </NextLink>
      <div className="flex xs:hidden">
        <HeaderHamburgerNav />
      </div>
      <div className="flex gap-6 max-xs:hidden">
        <span>v1.0.0-alpha.1</span>
        <a className="HeaderLink" href="https://github.com/mui/base-ui" rel="noopener">
          <GitHubIcon />
          GitHub
        </a>
      </div>
    </div>
  );
}

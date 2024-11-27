import * as React from 'react';
import NextLink from 'next/link';
import { GitHubIcon } from 'docs/src/icons/GitHub';
import * as MobileNav from './MobileNav';
import { nav } from '../nav';

export function Header() {
  return (
    <div className="Header">
      <div className="HeaderInner">
        <NextLink href="/" className="HeaderLink text-lg font-bold tracking-tight">
          base ui
        </NextLink>

        <div className="flex gap-6">
          <div className="flex gap-6 max-xs:hidden">
            <span>v1.0.0-alpha.1</span>
            <a className="HeaderLink" href="https://github.com/mui/base-ui" rel="noopener">
              <GitHubIcon />
              GitHub
            </a>
          </div>
          <div className="flex show-side-nav:hidden">
            <MobileNav.Root>
              <MobileNav.Trigger>Menu</MobileNav.Trigger>
              <MobileNav.Backdrop />
              <MobileNav.Popup>
                {nav.map((section) => (
                  <MobileNav.Section key={section.label}>
                    <MobileNav.Heading>{section.label}</MobileNav.Heading>
                    <MobileNav.List>
                      {section.links.map((link) => (
                        <MobileNav.Item key={link.href} href={link.href}>
                          {link.label}
                        </MobileNav.Item>
                      ))}
                    </MobileNav.List>
                  </MobileNav.Section>
                ))}
              </MobileNav.Popup>
            </MobileNav.Root>
          </div>{' '}
        </div>
      </div>
    </div>
  );
}

import * as React from 'react';
import NextLink from 'next/link';
import { GitHubIcon } from 'docs/src/components/icons/GitHub';
import * as MobileNav from './MobileNav';
import { nav } from '../nav';
import { NpmIcon } from './icons/Npm';
import { Logo } from './Logo';

const VERSION = 'v1.0.0-alpha-1';
export const HEADER_HEIGHT = 48;

export function Header() {
  return (
    <div className="Header">
      <div className="HeaderInner">
        <NextLink href="/" className="HeaderLogoLink">
          <Logo aria-label="Base UI" />
        </NextLink>

        <div className="flex gap-6 max-show-side-nav:hidden">
          <a
            className="HeaderLink"
            href="https://www.npmjs.com/package/@base-ui-components/react"
            rel="noopener"
          >
            <NpmIcon />
            {VERSION}
          </a>
          <a className="HeaderLink" href="https://github.com/mui/base-ui" rel="noopener">
            <GitHubIcon />
            GitHub
          </a>
        </div>

        <div className="flex show-side-nav:hidden">
          <MobileNav.Root>
            <MobileNav.Trigger className="HeaderButton">
              <div className="flex w-4 flex-col items-center gap-1">
                <div className="h-0.5 w-3.5 bg-current" />
                <div className="h-0.5 w-3.5 bg-current" />
              </div>
              Navigation
            </MobileNav.Trigger>
            <MobileNav.Portal>
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

                <MobileNav.Section>
                  <MobileNav.Heading>Resources</MobileNav.Heading>
                  <MobileNav.List>
                    <MobileNav.Item
                      href="https://www.npmjs.com/package/@base-ui-components/react"
                      rel="noopener"
                    >
                      <NpmIcon />
                      <span className="flex flex-grow-1 items-baseline justify-between">
                        npm package
                        <span className="text-md text-gray-600">{VERSION}</span>
                      </span>
                    </MobileNav.Item>
                    <MobileNav.Item href="https://github.com/mui/base-ui" rel="noopener">
                      <GitHubIcon className="mt-[-2px]" />
                      GitHub
                    </MobileNav.Item>
                  </MobileNav.List>
                </MobileNav.Section>
              </MobileNav.Popup>
            </MobileNav.Portal>
          </MobileNav.Root>
        </div>
      </div>
    </div>
  );
}

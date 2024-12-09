import * as React from 'react';
import NextLink from 'next/link';
import { GitHubIcon } from 'docs/src/icons/GitHub';
import * as MobileNav from './MobileNav';
import { nav } from '../nav';
import { NpmIcon } from '../icons/Npm';

const VERSION = 'v1.0.0-alpha-1';
export const HEADER_HEIGHT = 48;

export function Header() {
  return (
    <div className="Header">
      <div className="HeaderInner">
        <NextLink href="#" className="HeaderLogoLink">
          <svg width="17" height="24" viewBox="0 0 17 24" fill="currentcolor">
            <path d="M9.5001 7.01537C9.2245 6.99837 9 7.22385 9 7.49999V23C13.4183 23 17 19.4183 17 15C17 10.7497 13.6854 7.27351 9.5001 7.01537Z" />
            <path d="M8 9.8V12V23C3.58172 23 0 19.0601 0 14.2V12V1C4.41828 1 8 4.93989 8 9.8Z" />
          </svg>
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
                      <span className="text-sm text-gray-600">{VERSION}</span>
                    </span>
                  </MobileNav.Item>
                  <MobileNav.Item href="https://github.com/mui/base-ui" rel="noopener">
                    <GitHubIcon className="mt-[-2px]" />
                    GitHub
                  </MobileNav.Item>
                </MobileNav.List>
              </MobileNav.Section>
            </MobileNav.Popup>
          </MobileNav.Root>
        </div>
      </div>
    </div>
  );
}

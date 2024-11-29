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
          <svg
            width="70"
            height="16"
            viewBox="0 0 70 16"
            fill="currentcolor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M12 0H4H0V4V6V10V12V16H4H12H16V12V10L14 8L16 6V4V0H12ZM12 12V10H4V12H12ZM12 6H4V4H12V6Z"
            />
            <path d="M17.5 0H29.5H30.5L33.5 3V6V10V12V16H29.5H21.5H17.5V12V10V6H21.5H29.5V4H17.5V0ZM29.5 10H21.5V12H29.5V10Z" />
            <path d="M39 0H51V4H39V6H47H51V10V12V16H47H35V12H47V10H39H35V6V4V0H39Z" />
            <path d="M68.5 0H56.5H52.5V4V6V10V12V16H56.5H68.5V12H56.5V10H68.5V6H56.5V4H68.5V0Z" />
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

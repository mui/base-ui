import NextLink from 'next/link';
import { GitHubIcon } from 'docs/src/icons/GitHubIcon';
import * as MobileNav from './MobileNav';
import { sitemap } from '../app/sitemap';
import { NpmIcon } from '../icons/NpmIcon';
import { Logo } from './Logo';
import { SkipNav } from './SkipNav';
import { Search } from './Search';

export const titleMap: Record<string, string> = {
  'About Base\xa0UI': 'About',
};

export const HEADER_HEIGHT = 48;

export function Header({ isProduction }: { isProduction: boolean }) {
  return (
    <header className="Header">
      <div className="HeaderInner">
        <SkipNav>Skip to contents</SkipNav>
        <NextLink href="/" className="HeaderLogoLink">
          <Logo aria-label="Base UI" />
        </NextLink>
        <div className="flex gap-6 max-show-side-nav:hidden">
          <Search containedScroll enableKeyboardShortcut />
          <a
            className="HeaderLink"
            href="https://www.npmjs.com/package/@base-ui/react"
            rel="noopener"
          >
            <NpmIcon />
            {process.env.LIB_VERSION}
          </a>
          <a className="HeaderLink" href="https://github.com/mui/base-ui" rel="noopener">
            <GitHubIcon />
            GitHub
          </a>
        </div>
        <div className="flex items-center gap-2 show-side-nav:hidden">
          <div className="flex pr-4 pl-4">
            <Search />
          </div>
          {sitemap && (
            <MobileNav.Root>
              <MobileNav.Trigger className="HeaderButton whitespace-nowrap">
                <span className="flex w-4 flex-col items-center gap-1">
                  <span className="h-0.5 w-3.5 bg-current" />
                  <span className="h-0.5 w-3.5 bg-current" />
                </span>
                Navigation
              </MobileNav.Trigger>
              <MobileNav.Portal>
                <MobileNav.Backdrop />
                <MobileNav.Popup>
                  {Object.entries(sitemap.data).map(([name, section]) => (
                    <MobileNav.Section key={name}>
                      <MobileNav.Heading>{name}</MobileNav.Heading>
                      <MobileNav.List>
                        {section.pages
                          .filter((page) => (page.tags?.includes('Private') ? !isProduction : true))
                          .map((page) => (
                            <MobileNav.Item
                              key={page.title}
                              href={
                                page.path.startsWith('./')
                                  ? `${section.prefix}${page.path.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')}`
                                  : page.path
                              }
                              external={page.tags?.includes('External')}
                            >
                              {(page.title !== undefined && titleMap[page.title]) || page.title}
                              {page.tags?.includes('New') && <MobileNav.Badge>New</MobileNav.Badge>}
                              {page.tags?.includes('Preview') && (
                                <MobileNav.Badge>Preview</MobileNav.Badge>
                              )}
                            </MobileNav.Item>
                          ))}
                      </MobileNav.List>
                    </MobileNav.Section>
                  ))}
                  <MobileNav.Section>
                    <MobileNav.Heading>Resources</MobileNav.Heading>
                    <MobileNav.List>
                      <MobileNav.Item
                        href="https://www.npmjs.com/package/@base-ui/react"
                        rel="noopener"
                      >
                        <NpmIcon />
                        <span className="flex flex-grow-1 items-baseline justify-between">
                          npm package
                          <span className="text-md text-gray-600">{process.env.LIB_VERSION}</span>
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
          )}
        </div>
      </div>
    </header>
  );
}

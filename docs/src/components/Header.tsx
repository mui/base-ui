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

export function Header() {
  return (
    <header className="Header">
      <div className="HeaderInner">
        <SkipNav>Skip to contents</SkipNav>
        <NextLink href="/" className="HeaderLogoLink">
          <Logo aria-label="Base UI" />
        </NextLink>
        <div className="HeaderDesktopActions">
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
        <div className="HeaderMobileActions">
          <div className="HeaderMobileSearch">
            <Search />
          </div>
          {sitemap && (
            <MobileNav.Root>
              <MobileNav.Trigger className="HeaderButton HeaderNavTrigger">
                <span className="HeaderNavTriggerBars" />
                Navigation
              </MobileNav.Trigger>
              <MobileNav.Portal>
                <MobileNav.Backdrop />
                <MobileNav.Popup>
                  {Object.entries(
                    sitemap.data as Record<
                      string,
                      {
                        title?: string;
                        prefix?: string;
                        pages: { title: string; tags?: string[]; path: string }[];
                      }
                    >,
                  ).map(([name, section]) => (
                    <MobileNav.Section key={name}>
                      <MobileNav.Heading>{name}</MobileNav.Heading>
                      <MobileNav.List>
                        {section.pages.map((page) => (
                          <MobileNav.Item
                            key={page.title}
                            href={
                              page.path.startsWith('./')
                                ? `${section.prefix}${page.path.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')}`
                                : page.path
                            }
                            external={page.tags?.includes('External')}
                          >
                            {titleMap[page.title] || page.title}
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
                        <span className="HeaderResourceRow">
                          npm package
                          <span className="HeaderVersion">{process.env.LIB_VERSION}</span>
                        </span>
                      </MobileNav.Item>
                      <MobileNav.Item href="https://github.com/mui/base-ui" rel="noopener">
                        <GitHubIcon className="HeaderGitHubIcon" />
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

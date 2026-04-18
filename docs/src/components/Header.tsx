import NextLink from 'next/link';
import { GitHubIcon } from 'docs/src/icons/GitHubIcon';
import * as MobileNav from './MobileNav';
import { sitemap } from '../app/sitemap';
import { NpmIcon } from '../icons/NpmIcon';
import { Logo } from './Logo';
import { SkipNav } from './SkipNav';
import { Search } from './Search';
import './Header.css';

export const titleMap: Record<string, string> = {
  'About Base\xa0UI': 'About',
};

export const HEADER_HEIGHT = 48;

const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

export function Header() {
  return (
    <header className="Header">
      <div className="HeaderInner">
        <SkipNav>Skip to contents</SkipNav>
        <NextLink href="/" className="HeaderLogoLink" aria-label="Base UI - Go to homepage">
          <Logo aria-label="Base UI" />
        </NextLink>
        <div className="HeaderDesktopActions">
          <Search containedScroll enableKeyboardShortcut />
          <a
            className="HeaderLink"
            href="https://www.npmjs.com/package/@base-ui/react"
            rel="noopener"
            aria-label={`npm version ${process.env.LIB_VERSION}`}
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
                  {Object.entries(sitemap.data).map(([name, section]) => (
                    <MobileNav.Section key={name}>
                      <MobileNav.Heading>{name}</MobileNav.Heading>
                      <MobileNav.List>
                        {section.pages
                          .filter((page) => (page.audience === 'private' ? showPrivatePages : true))
                          .map((page) => {
                            const isNewPage = page.tags?.includes('New');
                            const isPreviewPage = page.tags?.includes('Preview');
                            const isPrivatePage = page.audience === 'private';
                            return (
                              <MobileNav.Item
                                key={page.title}
                                href={
                                  page.path.startsWith('./')
                                    ? `${section.prefix}${page.path.replace(/^\.\//, '').replace(/\/page\.mdx$/, '')}`
                                    : page.path
                                }
                                external={page.tags?.includes('External')}
                              >
                                {(page.title && titleMap[page.title]) || page.title}
                                {isPrivatePage && <MobileNav.Badge>Private</MobileNav.Badge>}
                                {isPreviewPage && <MobileNav.Badge>Preview</MobileNav.Badge>}
                                {isNewPage && !isPreviewPage && !isPrivatePage && (
                                  <MobileNav.Badge>New</MobileNav.Badge>
                                )}
                              </MobileNav.Item>
                            );
                          })}
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

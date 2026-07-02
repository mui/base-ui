import * as React from 'react';
import * as MobileNav from './MobileNav';
import { sitemap } from '../app/sitemap';
import { GitHubIcon } from '../icons/GitHubIcon';
import { NpmIcon } from '../icons/NpmIcon';
import { getDisplayTitle } from './getDisplayTitle';

const showPrivatePages = process.env.SHOW_PRIVATE_PAGES === 'true';

export function MobileNavContent() {
  if (!sitemap) {
    return null;
  }

  return (
    <React.Fragment>
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
                    <span className="MobileNavLinkText">{getDisplayTitle(page.title)}</span>
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
          <MobileNav.Item href="https://www.npmjs.com/package/@base-ui/react">
            <NpmIcon />
            <span className="MobileNavResourceRow">
              <span className="MobileNavLinkText">npm package</span>
              <span className="MobileNavVersion">{process.env.LIB_VERSION}</span>
            </span>
          </MobileNav.Item>
          <MobileNav.Item href="https://github.com/mui/base-ui">
            <GitHubIcon />
            <span className="MobileNavLinkText">GitHub</span>
          </MobileNav.Item>
        </MobileNav.List>
      </MobileNav.Section>
    </React.Fragment>
  );
}

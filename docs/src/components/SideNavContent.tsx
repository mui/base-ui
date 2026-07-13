import * as React from 'react';
import type { Sitemap } from '@mui/internal-docs-infra/useSearch/types';
import * as SideNav from './SideNav';
import { GitHubIcon } from '../icons/GitHubIcon';
import { NpmIcon } from '../icons/NpmIcon';
import { getDisplayTitle } from '../utils/getDisplayTitle';
import { getNavSections } from '../utils/navSections';
import { getSitemapPageInfo, isSitemapPageVisible } from '../utils/sitemapPage';

interface SideNavContentProps {
  sitemap: Sitemap | null | undefined;
}

export function SideNavContent({ sitemap }: SideNavContentProps) {
  return (
    <React.Fragment>
      {(sitemap ? getNavSections(sitemap) : []).map((section) => (
        <SideNav.Section key={section.name}>
          <SideNav.Heading>{section.name}</SideNav.Heading>
          <SideNav.List>
            {section.pages.filter(isSitemapPageVisible).map((page) => {
              const pageInfo = getSitemapPageInfo(section, page);

              return (
                <SideNav.Item key={page.title} href={pageInfo.href} external={pageInfo.external}>
                  {getDisplayTitle(page.title)}
                  {pageInfo.badges.map((badge) => (
                    <SideNav.Badge key={badge}>{badge}</SideNav.Badge>
                  ))}
                </SideNav.Item>
              );
            })}
          </SideNav.List>
        </SideNav.Section>
      ))}
      <SideNav.Separator />
      <SideNav.Section>
        <SideNav.List>
          <SideNav.Item href="https://github.com/mui/base-ui" icon={<GitHubIcon />} external>
            GitHub
          </SideNav.Item>
          <SideNav.Item
            href="https://www.npmjs.com/package/@base-ui/react"
            icon={<NpmIcon />}
            external
          >
            <span>
              npm
              <span className="SideNavVersion">{process.env.LIB_VERSION}</span>
            </span>
          </SideNav.Item>
        </SideNav.List>
      </SideNav.Section>
    </React.Fragment>
  );
}

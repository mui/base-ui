import NextLink from 'next/link';

import { DocsMobileNav } from './DocsMobileNav';
import { Logo } from './Logo';
import { SkipNav } from './SkipNav';
import { SearchTrigger } from './SearchTrigger';
import './Header.css';

export { titleMap } from './DocsMobileNav';

export const HEADER_HEIGHT_MOBILE = 48;
export const HEADER_HEIGHT_DESKTOP = 64;

export function Header() {
  return (
    <header className="Header">
      <div className="HeaderInner">
        <SkipNav>Skip to contents</SkipNav>
        <NextLink href="/" className="HeaderLogoLink" aria-label="Go to the homepage">
          <Logo aria-label="Base UI" />
        </NextLink>
        <div className="HeaderDesktopActions">
          <SearchTrigger
            containedScroll
            enableKeyboardShortcut
            keyboardShortcutMediaQuery="(min-width: 64rem)"
          />
        </div>
        <div className="HeaderMobileActions">
          <DocsMobileNav triggerClassName="HeaderButton HeaderNavTrigger MobileNavHeaderTrigger" />
        </div>
      </div>
    </header>
  );
}

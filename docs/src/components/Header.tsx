import NextLink from 'next/link';

import { HeaderSearch } from './HeaderSearch';
import { Logo } from './Logo';
import { MobileNavContent } from './MobileNavContent';
import { SkipNav } from './SkipNav';
import './Header.css';

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
        <HeaderSearch mobileNavContent={<MobileNavContent />} />
      </div>
    </header>
  );
}

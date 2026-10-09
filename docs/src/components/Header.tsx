import { LogoLink } from './LogoLink';
import { SearchControls } from './SearchControls';
import { SkipNav } from './SkipNav';
import './Header.css';

export const HEADER_HEIGHT_DESKTOP = 64;

export function Header() {
  return (
    <header className="Header">
      <div className="HeaderInner">
        <SkipNav>Skip to contents</SkipNav>
        <LogoLink />
        <div className="HeaderSearch">
          <SearchControls
            desktopTriggerClassName="HeaderSearchDesktopTrigger"
            mobileTriggerClassName="HeaderSearchMobileTrigger"
          />
        </div>
      </div>
    </header>
  );
}

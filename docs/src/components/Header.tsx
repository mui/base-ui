import { LogoLink } from './LogoLink';
import { SearchControls } from './SearchControls';
import { SkipNav } from './SkipNav';
import './Header.css';

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

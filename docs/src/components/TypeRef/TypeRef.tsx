'use client';

import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useType } from '@mui/internal-docs-infra/useType';
import { Popup } from '../Popup';
import { ReferenceTable } from '../ReferenceTable/ReferenceTable';

import './TypeRef.css';

const EMPTY_SET = new Set<string>();
const ActiveTypeRefContext = React.createContext<ReadonlySet<string>>(EMPTY_SET);

interface TypeRefProps {
  /** The anchor href for the type documentation */
  href: string;
  /** The matched identifier name (e.g., "Trigger", "Accordion.Trigger") */
  name: string;
  /** Optional CSS class name(s) inherited from the syntax highlighting span */
  className?: string;
  /** The rendered text content */
  children: React.ReactNode;
}

/**
 * Renders a type reference as an interactive element.
 * When clicked, displays a popover showing the type's documentation
 * rendered via `ReferenceTable`.
 *
 * Falls back to a standard anchor link when no type data is available.
 * When rendered inside a popover for the same type (self-reference),
 * renders a plain span instead of a nested popover.
 */
export function TypeRef({ href, name, className, children }: TypeRefProps) {
  const activeTypeNames = React.useContext(ActiveTypeRefContext);
  const typeData = useType(name);
  const [open, setOpen] = React.useState(false);
  const aliases = typeData?.meta.aliases;
  const nextActiveTypeNames = React.useMemo(
    () => new Set([...activeTypeNames, name, ...(aliases ?? [])]),
    [activeTypeNames, name, aliases],
  );
  const handleContentClick = useStableCallback((event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('a')) {
      setOpen(false);
    }
  });

  // Render a plain span for circular type references (direct or through intermediaries)
  if (activeTypeNames.has(name)) {
    return <span className={className}>{children}</span>;
  }

  // Fall back to a standard anchor if no type data is available
  if (!typeData) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className={`${className ?? ''} TypeRefTrigger`.trim()}>
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup render={<Popup className="TypeRefPopup" />}>
            <div className="TypeRefHeader">
              <span className="TypeRefName">{typeData.meta.name}</span>
              <div className="TypeRefControls">
                {typeData.meta.type !== 'raw' && (
                  <Popover.Close
                    // eslint-disable-next-line jsx-a11y/control-has-associated-label -- children provide the label
                    render={<a href={href} />}
                    nativeButton={false}
                    className="TypeRefDocsLink"
                  >
                    Full docs
                  </Popover.Close>
                )}
                <Popover.Close aria-label="Close" className="TypeRefClose">
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Popover.Close>
              </div>
            </div>
            <ActiveTypeRefContext.Provider value={nextActiveTypeNames}>
              {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
              <div className="TypeRefContent" onClick={handleContentClick}>
                {typeData.meta.type === 'raw' ? (
                  typeData.meta.data.formattedCode
                ) : (
                  <ReferenceTable type={typeData.meta} additionalTypes={[]} hideDescription />
                )}
              </div>
            </ActiveTypeRefContext.Provider>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

'use client';

import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { useType } from '@mui/internal-docs-infra/useType';
import { Popup } from '../Popup';
import { ReferenceTable } from '../ReferenceTable/ReferenceTable';

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
 */
export function TypeRef({ href, name, className, children }: TypeRefProps) {
  const typeData = useType(name);

  // Fall back to a standard anchor if no type data is available
  if (!typeData) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger
        className={`${className ?? ''} cursor-pointer border-0 bg-transparent p-0 font-[inherit] text-[inherit] underline decoration-dotted decoration-[var(--color-violet)]`.trim()}
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup render={<Popup className="max-w-[min(32rem,var(--available-width))]" />}>
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
              <span className="text-sm font-medium text-gray-900">{typeData.meta.name}</span>
              <div className="flex items-center gap-2">
                {typeData.meta.type !== 'raw' && (
                  <a
                    href={href}
                    className="text-xs text-gray-600 underline decoration-gray-300 hover:text-gray-900 hover:decoration-gray-500"
                  >
                    Full docs
                  </a>
                )}
                <Popover.Close
                  aria-label="Close"
                  className="flex size-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 1L7 7M7 1L1 7" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </Popover.Close>
              </div>
            </div>
            <div className="p-4">
              {typeData.meta.type === 'raw' ? (
                typeData.meta.data.formattedCode
              ) : (
                <ReferenceTable type={typeData.meta} additionalTypes={[]} hideDescription />
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

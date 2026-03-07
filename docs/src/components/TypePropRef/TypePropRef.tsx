'use client';

import * as React from 'react';
import { Popover } from '@base-ui/react/popover';
import { useTypeProp } from '@mui/internal-docs-infra/useType';
import type { TypePropRefProps } from '@mui/internal-docs-infra/useType';
import { Popup } from '../Popup';

import './TypePropRef.css';

/**
 * Renders a type property reference as an interactive element.
 * When this is the definition site (`id` is present), renders a span with the anchor id.
 * When property metadata is available, shows a popover with description, type, and default.
 * At the definition site the popover omits the type (already shown inline).
 *
 * Falls back to a plain span or anchor when no property data is available.
 */
function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

export function TypePropRef({ id, name, prop, className, children }: TypePropRefProps) {
  const propData = useTypeProp(name, prop);
  const property = propData?.property;
  const resolvedHref = `#${name}-${kebabToCamelCase(prop)}`;

  const hasPopoverContent =
    property &&
    (property.description || property.default || property.example || property.detailedType);

  // Definition site with popover content: show anchor span + popover for meta
  if (id && hasPopoverContent) {
    return (
      <Popover.Root>
        <Popover.Trigger
          openOnHover
          delay={200}
          id={id}
          className={`${className ?? ''} TypePropRefTrigger`.trim()}
        >
          {children}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup render={<Popup className="TypePropRefPopup" />}>
              <Popover.Arrow className="TypePropRefArrow">
                <PopoverArrowSvg />
              </Popover.Arrow>
              <PropPopoverContent property={property} />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  // Definition site without popover content: plain span with anchor
  if (id) {
    return (
      <span id={id} className={className}>
        {children}
      </span>
    );
  }

  // Reference site with popover content
  if (hasPopoverContent) {
    return (
      <Popover.Root>
        <Popover.Trigger className={`${className ?? ''} TypePropRefTrigger`.trim()}>
          {children}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={8}>
            <Popover.Popup render={<Popup className="TypePropRefPopup" />}>
              <Popover.Arrow className="TypePropRefArrow">
                <PopoverArrowSvg />
              </Popover.Arrow>
              {resolvedHref && (
                <div className="TypePropRefHeader">
                  <a href={resolvedHref} className="TypePropRefDocsLink">
                    Go to definition
                  </a>
                </div>
              )}
              <PropPopoverContent property={property} showType />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    );
  }

  // No popover: fall back to link or plain span
  if (!resolvedHref) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a href={resolvedHref} className={`${className ?? ''} TypePropRefLink`.trim()}>
      {children}
    </a>
  );
}

function PropPopoverContent({
  property,
  showType,
}: {
  property: NonNullable<ReturnType<typeof useTypeProp>>['property'];
  showType?: boolean;
}) {
  return (
    <dl className="TypePropRefList">
      {property.description && (
        <div className="TypePropRefRow">
          <dd className="TypePropRefDescription">{property.description}</dd>
        </div>
      )}
      {showType && (
        <div className="TypePropRefRow">
          <dt className="TypePropRefLabel">Type</dt>
          <dd className="TypePropRefValue">{property.detailedType ?? property.type}</dd>
        </div>
      )}
      {property.default && (
        <div className="TypePropRefRow">
          <dt className="TypePropRefLabel">Default</dt>
          <dd className="TypePropRefValue">{property.default}</dd>
        </div>
      )}
      {property.example && (
        <div className="TypePropRefRow">
          <dt className="TypePropRefLabel">Example</dt>
          <dd className="TypePropRefValue">{property.example}</dd>
        </div>
      )}
    </dl>
  );
}

function PopoverArrowSvg() {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="TypePropRefArrowFill"
      />
      <path
        d="M8.99542 1.85876C9.75604 1.17425 10.9106 1.17422 11.6713 1.85878L16.5281 6.22989C17.0789 6.72568 17.7938 7.00001 18.5349 7.00001L15.89 7L11.0023 2.60207C10.622 2.2598 10.0447 2.2598 9.66436 2.60207L4.77734 7L2.13171 7.00001C2.87284 7.00001 3.58774 6.72568 4.13861 6.22989L8.99542 1.85876Z"
        className="TypePropRefArrowStroke"
      />
      <path
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
        className="TypePropRefArrowStrokeDark"
      />
    </svg>
  );
}

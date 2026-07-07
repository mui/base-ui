import * as React from 'react';
import { Field } from '@base-ui/react/field';
import styles from '../field.module.css';
import rw from '../field-real-world.module.css';

/**
 * Recreation of nauvalazhar/selia's `FieldItem` grid layout: a `grid-cols-[auto_1fr]`
 * template with the description/error text pinned to the second column, so it aligns
 * under the *control* (which sits next to a leading icon) rather than under the label —
 * a concrete alternative to the vertical-stack default every other Field story uses.
 * Recomposed from the ideas in nauvalazhar/selia `field.tsx` (MIT, code-ok,
 * research/d-real-world-usage/field/ranked.json #6).
 */
function SearchIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      {...props}
      style={{ display: 'block', ...props.style }}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M13 13l-2.5-2.5" />
    </svg>
  );
}

export function GridLayoutFieldExample() {
  return (
    <Field.Root name="query" validationMode="onChange" className={rw.GridField}>
      <Field.Label className={rw.GridLabel}>Search the docs</Field.Label>
      <span className={rw.GridIcon} aria-hidden="true">
        <SearchIcon />
      </span>
      <Field.Control required placeholder="e.g. useRender" className={rw.GridInput} />
      <Field.Description className={rw.GridDescription}>
        Aligned under the control, not the label — try resizing to compare with the
        vertical-stack stories above.
      </Field.Description>
      <Field.Error className={rw.GridError} match="valueMissing">
        A search term is required.
      </Field.Error>
    </Field.Root>
  );
}

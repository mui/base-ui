'use client';

export function resolveAriaLabelledBy(
  fieldLabelId: string | undefined,
  localLabelId: string | undefined,
  defaultLabelId: string | undefined,
  ariaLabel: string | null | undefined,
  hydrated: boolean,
) {
  return (
    fieldLabelId ?? localLabelId ?? (ariaLabel == null && !hydrated ? defaultLabelId : undefined)
  );
}

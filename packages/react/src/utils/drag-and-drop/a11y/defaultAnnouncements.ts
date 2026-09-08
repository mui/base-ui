import type { LocalizationProviderTranslations } from '../../../localization-provider/types';
import type { DragSource, DragKeyboardAnnouncements } from '../../../types/drag';

/**
 * Build default keyboard-drag announcements from a translations table. `moved`
 * and `dropped` name the innermost *labeled* drop target ("card on To-do");
 * over unlabeled targets the position phrase is `null`, which the stock locales
 * render as silence for `moved` — a locale overriding `dragAnnouncementMoved`
 * still gets to speak.
 */
export function buildDefaultAnnouncements<TSourceData = unknown>(
  translations: LocalizationProviderTranslations,
): Required<DragKeyboardAnnouncements<TSourceData>> {
  const describe = (source: DragSource<TSourceData>): string =>
    translations.dragDefaultItemLabel({ label: source.label });
  // The innermost hovered target that declared a `label`: a labeled zone keeps
  // announcing its name while an unlabeled inner target (a slot, a gap) is the
  // one under the cursor.
  const positionPhrase = (dropTargets: readonly { label: string | undefined }[]): string | null => {
    const label = dropTargets.find((target) => target.label !== undefined)?.label;
    return label === undefined
      ? null
      : translations.dragDropPositionPhrase({ position: 'on', target: label });
  };
  // A lone draggable always carries exactly itself; only a collection drag can
  // pick up more than one item.
  const count = 1;
  return {
    pickedUp: ({ source }) =>
      translations.dragAnnouncementPickedUp({ label: describe(source), count }),
    moved: ({ source, location }) =>
      translations.dragAnnouncementMoved({
        label: describe(source),
        count,
        positionPhrase: positionPhrase(location.current.dropTargets),
      }),
    dropped: ({ source, location }) =>
      translations.dragAnnouncementDropped({
        label: describe(source),
        count,
        positionPhrase: positionPhrase(location.current.dropTargets),
        hasDropTarget: location.current.dropTargets.length > 0,
      }),
    canceled: ({ source }) =>
      translations.dragAnnouncementCanceled({ label: describe(source), count }),
    reachedEdge: () => null,
  };
}

const ANNOUNCEMENT_PHASES = ['pickedUp', 'moved', 'dropped', 'canceled', 'reachedEdge'] as const;

/**
 * Merge consumer keyboard-announcement overrides over defaults, phase by phase:
 * a supplied override wins (including one returning `null` to stay silent); an
 * omitted callback keeps the default. Both sides are read through getters on
 * every announcement, so live parameter and locale changes apply without
 * re-merging. Shared by `DragEngineImpl` and the collection plugin.
 */
export function mergeKeyboardAnnouncements<TSourceData = unknown>(
  getOverrides: () => DragKeyboardAnnouncements<TSourceData> | undefined,
  getDefaults: () => Required<DragKeyboardAnnouncements<TSourceData>>,
): Required<DragKeyboardAnnouncements<TSourceData>> {
  const merged = {} as Required<DragKeyboardAnnouncements<TSourceData>>;
  for (const phase of ANNOUNCEMENT_PHASES) {
    merged[phase] = (parameters) => {
      const override = getOverrides()?.[phase];
      return override ? override(parameters) : getDefaults()[phase](parameters);
    };
  }
  return merged;
}

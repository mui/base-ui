import * as React from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import styles from '../autocomplete.module.css';
import rw from '../autocomplete-real-world.module.css';

/**
 * Recreation of keenthemes/reui's full-anatomy, multi-skin Autocomplete: `Backdrop` +
 * `Arrow` are rendered (the fullest part list observed for this component anywhere in
 * the research corpus) and every class list is compound-styled so a single ancestor
 * `data-skin` attribute swaps the whole visual skin, matching reui's `style-vega` /
 * `style-nova` / … convention. Recomposed from the ideas in keenthemes/reui
 * `registry-reui/bases/base/reui/autocomplete.tsx` (MIT, code-ok,
 * research/d-real-world-usage/autocomplete/ranked.json #4).
 */
const componentNames = ['Autocomplete', 'Button', 'Dialog', 'Field', 'Form', 'Select', 'Tabs'];

const skins = ['vega', 'nova'] as const;
type Skin = (typeof skins)[number];

export function MultiSkinAutocompleteExample() {
  const [skin, setSkin] = React.useState<Skin>('vega');

  return (
    <div className={rw.SkinRoot}>
      <div className={rw.SkinSwitcher}>
        {skins.map((candidate) => (
          <button
            key={candidate}
            type="button"
            className={rw.SkinButton}
            aria-pressed={skin === candidate}
            onClick={() => setSkin(candidate)}
          >
            {candidate}
          </button>
        ))}
      </div>
      <label className={styles.Label}>
        Search components
        <Autocomplete.Root items={componentNames}>
          <Autocomplete.Input placeholder="e.g. button" className={styles.Input} />
          <Autocomplete.Portal>
            <Autocomplete.Backdrop className={rw.SkinBackdrop} />
            <Autocomplete.Positioner className={styles.Positioner} sideOffset={8}>
              <Autocomplete.Popup className={rw.SkinPopup} data-skin={skin}>
                <Autocomplete.Arrow className={rw.SkinArrow} data-skin={skin} />
                <Autocomplete.Empty className={styles.Empty}>No matches.</Autocomplete.Empty>
                <Autocomplete.List className={styles.List}>
                  {(item: string) => (
                    <Autocomplete.Item key={item} value={item} className={rw.SkinItem} data-skin={skin}>
                      {item}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.List>
              </Autocomplete.Popup>
            </Autocomplete.Positioner>
          </Autocomplete.Portal>
        </Autocomplete.Root>
      </label>
    </div>
  );
}

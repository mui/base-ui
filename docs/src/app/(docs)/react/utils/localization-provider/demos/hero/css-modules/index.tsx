'use client';
import { Draggable } from '@base-ui/react/draggable';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { frFR } from '@base-ui/react/locale-frFR';
import styles from './index.module.css';

const cardKind = Draggable.createKind('card');

export default function LocalizationProviderHero() {
  return (
    <LocalizationProvider translations={frFR}>
      <div className={styles.Root} lang="fr">
        <Draggable.Root className={styles.Card} kind={cardKind} label="la carte">
          Déplacez-moi
          <Draggable.ClonedPreview />
        </Draggable.Root>
        <p className={styles.Hint}>Utilisez Espace et les touches fléchées.</p>
      </div>
    </LocalizationProvider>
  );
}

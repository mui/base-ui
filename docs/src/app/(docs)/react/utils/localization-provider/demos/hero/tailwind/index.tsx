'use client';
import { Draggable } from '@base-ui/react/draggable';
import { LocalizationProvider } from '@base-ui/react/localization-provider';
import { frFR } from '@base-ui/react/locale-frFR';

const cardKind = Draggable.createKind('card');

export default function LocalizationProviderHero() {
  return (
    <LocalizationProvider translations={frFR}>
      <div
        className="flex min-h-40 select-none flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-gray-900"
        lang="fr"
      >
        <Draggable.Root
          className="cursor-grab border border-gray-900 bg-white px-4 py-2 text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 data-[drag-preview]:shadow-[0.25rem_0.25rem_0_rgb(0_0_0_/_12%)] dark:border-white dark:bg-gray-950 dark:text-white"
          kind={cardKind}
          label="la carte"
        >
          Déplacez-moi
          <Draggable.ClonedPreview />
        </Draggable.Root>
        <p className="m-0 text-sm text-gray-600 dark:text-gray-400">
          Utilisez Espace et les touches fléchées.
        </p>
      </div>
    </LocalizationProvider>
  );
}

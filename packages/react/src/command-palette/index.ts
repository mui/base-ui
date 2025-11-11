import { CommandPaletteRoot } from './root/CommandPaletteRoot';
import { CommandPaletteTrigger } from './trigger/CommandPaletteTrigger';
import { CommandPalettePortal } from './portal/CommandPalettePortal';
import { CommandPalettePopup } from './popup/CommandPalettePopup';
import { CommandPaletteInput } from './input/CommandPaletteInput';
import { CommandPaletteList } from './list/CommandPaletteList';
import { CommandPaletteItem } from './item/CommandPaletteItem';
import { CommandPaletteEmpty } from './empty/CommandPaletteEmpty';

export const CommandPalette = {
  Root: CommandPaletteRoot,
  Trigger: CommandPaletteTrigger,
  Portal: CommandPalettePortal,
  Popup: CommandPalettePopup,
  Input: CommandPaletteInput,
  List: CommandPaletteList,
  Item: CommandPaletteItem,
  Empty: CommandPaletteEmpty,
};

export * from './root/CommandPaletteRoot';
export * from './trigger/CommandPaletteTrigger';
export * from './portal/CommandPalettePortal';
export * from './popup/CommandPalettePopup';
export * from './input/CommandPaletteInput';
export * from './list/CommandPaletteList';
export * from './item/CommandPaletteItem';
export * from './empty/CommandPaletteEmpty';
export {
  CommandPaletteStore,
  type CommandPaletteStoreOptions,
  type CommandPaletteItem,
} from './store/CommandPaletteStore';
export * from './store/CommandPaletteHandle';
export * from './hooks/useCommandPaletteItems';

export { createCommandPaletteHandle as createHandle } from './store/CommandPaletteHandle';

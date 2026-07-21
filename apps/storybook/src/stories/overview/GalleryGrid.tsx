import * as React from 'react';
import { composeStories } from '@storybook/react-vite';
import styles from './gallery.module.css';

import * as AccordionStories from '../accordion/accordion.stories';
import * as AlertDialogStories from '../alert-dialog/alert-dialog.stories';
import * as AutocompleteStories from '../autocomplete/autocomplete.stories';
import * as AvatarStories from '../avatar/avatar.stories';
import * as ButtonStories from '../button/button.stories';
import * as CheckboxStories from '../checkbox/checkbox.stories';
import * as CheckboxGroupStories from '../checkbox-group/checkbox-group.stories';
import * as CollapsibleStories from '../collapsible/collapsible.stories';
import * as ComboboxStories from '../combobox/combobox.stories';
import * as ContextMenuStories from '../context-menu/context-menu.stories';
import * as DialogStories from '../dialog/dialog.stories';
import * as DirectionProviderStories from '../direction-provider/direction-provider.stories';
import * as DrawerStories from '../drawer/drawer.stories';
import * as FieldStories from '../field/field.stories';
import * as FieldsetStories from '../fieldset/fieldset.stories';
import * as FormStories from '../form/form.stories';
import * as InputStories from '../input/input.stories';
import * as MenuStories from '../menu/menu.stories';
import * as MenubarStories from '../menubar/menubar.stories';
import * as MergePropsStories from '../merge-props/merge-props.stories';
import * as MeterStories from '../meter/meter.stories';
import * as NavigationMenuStories from '../navigation-menu/navigation-menu.stories';
import * as NumberFieldStories from '../number-field/number-field.stories';
import * as OtpFieldStories from '../otp-field/otp-field.stories';
import * as PopoverStories from '../popover/popover.stories';
import * as PreviewCardStories from '../preview-card/preview-card.stories';
import * as ProgressStories from '../progress/progress.stories';
import * as RadioStories from '../radio/radio.stories';
import * as ScrollAreaStories from '../scroll-area/scroll-area.stories';
import * as SelectStories from '../select/select.stories';
import * as SeparatorStories from '../separator/separator.stories';
import * as SliderStories from '../slider/slider.stories';
import * as SwitchStories from '../switch/switch.stories';
import * as TabsStories from '../tabs/tabs.stories';
import * as ToastStories from '../toast/toast.stories';
import * as ToggleStories from '../toggle/toggle.stories';
import * as ToggleGroupStories from '../toggle-group/toggle-group.stories';
import * as ToolbarStories from '../toolbar/toolbar.stories';
import * as TooltipStories from '../tooltip/tooltip.stories';
import * as UseRenderStories from '../use-render/use-render.stories';

/**
 * The single source of truth for the "all components at a glance" grid — rendered by
 * both the Overview/Gallery docs page (gallery.mdx) and the Overview/All components
 * snapshot story (gallery.stories.tsx; Chromatic can't snapshot docs pages). Stories
 * are mounted via portable stories (composeStories), hero where one exists, otherwise
 * the family's most representative story. CSP Provider is docs-only and has no card.
 */
const families: ReadonlyArray<{ name: string; Preview: React.ComponentType }> = [
  { name: 'Accordion', Preview: composeStories(AccordionStories).Hero },
  { name: 'Alert dialog', Preview: composeStories(AlertDialogStories).Hero },
  { name: 'Autocomplete', Preview: composeStories(AutocompleteStories).Hero },
  { name: 'Avatar', Preview: composeStories(AvatarStories).Hero },
  { name: 'Button', Preview: composeStories(ButtonStories).Hero },
  { name: 'Checkbox', Preview: composeStories(CheckboxStories).Basic },
  { name: 'Checkbox group', Preview: composeStories(CheckboxGroupStories).Basic },
  { name: 'Collapsible', Preview: composeStories(CollapsibleStories).Hero },
  { name: 'Combobox', Preview: composeStories(ComboboxStories).Hero },
  { name: 'Context menu', Preview: composeStories(ContextMenuStories).Hero },
  { name: 'Dialog', Preview: composeStories(DialogStories).Hero },
  { name: 'Direction provider', Preview: composeStories(DirectionProviderStories).Hero },
  { name: 'Drawer', Preview: composeStories(DrawerStories).Hero },
  { name: 'Field', Preview: composeStories(FieldStories).Hero },
  { name: 'Fieldset', Preview: composeStories(FieldsetStories).Hero },
  { name: 'Form', Preview: composeStories(FormStories).Hero },
  { name: 'Input', Preview: composeStories(InputStories).Hero },
  { name: 'Menu', Preview: composeStories(MenuStories).Hero },
  { name: 'Menubar', Preview: composeStories(MenubarStories).Hero },
  { name: 'mergeProps', Preview: composeStories(MergePropsStories).HandlerOrderAndCancellation },
  { name: 'Meter', Preview: composeStories(MeterStories).Hero },
  { name: 'Navigation menu', Preview: composeStories(NavigationMenuStories).Hero },
  { name: 'Number field', Preview: composeStories(NumberFieldStories).Hero },
  { name: 'OTP field', Preview: composeStories(OtpFieldStories).Hero },
  { name: 'Popover', Preview: composeStories(PopoverStories).Hero },
  { name: 'Preview card', Preview: composeStories(PreviewCardStories).Hero },
  { name: 'Progress', Preview: composeStories(ProgressStories).Hero },
  { name: 'Radio', Preview: composeStories(RadioStories).Basic },
  { name: 'Scroll area', Preview: composeStories(ScrollAreaStories).Hero },
  { name: 'Select', Preview: composeStories(SelectStories).Basic },
  { name: 'Separator', Preview: composeStories(SeparatorStories).Hero },
  { name: 'Slider', Preview: composeStories(SliderStories).Hero },
  { name: 'Switch', Preview: composeStories(SwitchStories).Hero },
  { name: 'Tabs', Preview: composeStories(TabsStories).Hero },
  { name: 'Toast', Preview: composeStories(ToastStories).Hero },
  { name: 'Toggle', Preview: composeStories(ToggleStories).Hero },
  { name: 'Toggle group', Preview: composeStories(ToggleGroupStories).Hero },
  { name: 'Toolbar', Preview: composeStories(ToolbarStories).Hero },
  { name: 'Tooltip', Preview: composeStories(TooltipStories).Hero },
  { name: 'useRender', Preview: composeStories(UseRenderStories).CustomComponent },
];

export function GalleryGrid() {
  return (
    <div className={styles.Grid}>
      {families.map(({ name, Preview }) => (
        <div key={name} className={styles.Card}>
          <div className={styles.CardName}>{name}</div>
          <div className={styles.CardPreview}>
            <Preview />
          </div>
        </div>
      ))}
    </div>
  );
}

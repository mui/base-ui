import { TemporalSupportedValue } from '../../../types';
import { selectors } from './selectors';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
import { TemporalFieldStore } from './TemporalFieldStore';

/**
 * Plugin to build the props to pass to the input element.
 */
export class TemporalFieldInputPropsPlugin<TValue extends TemporalSupportedValue, TError> {
  private store: TemporalFieldStore<TValue, TError, any>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'inputProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (selectors.disabled(this.store.state)) {
      return;
    }

    const lastSectionIndex = TemporalFieldSectionPlugin.selectors.lastSectionIndex(
      this.store.state,
    );
    const selectedSections = TemporalFieldSectionPlugin.selectors.selectedSections(
      this.store.state,
    );

    // eslint-disable-next-line default-case
    switch (true) {
      // Move selection to next section
      case event.key === 'ArrowRight': {
        event.preventDefault();

        if (selectedSections == null) {
          this.store.section.setSelectedSections(0);
        } else if (selectedSections < lastSectionIndex) {
          this.store.section.setSelectedSections(selectedSections + 1);
        }
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();

        if (selectedSections == null) {
          this.store.section.setSelectedSections(lastSectionIndex);
        } else if (selectedSections > 0) {
          this.store.section.setSelectedSections(selectedSections - 1);
        }
        break;
      }

      // Reset the value of the selected section
      case event.key === 'Delete': {
        event.preventDefault();

        if (!selectors.editable(this.store.state)) {
          break;
        }

        this.store.section.clearActive();
        break;
      }

      // Increment / decrement the selected section value
      case this.store.valueAdjustment.isAdjustSectionValueKeyCode(event.key): {
        event.preventDefault();

        const activeSection = TemporalFieldSectionPlugin.selectors.activeSection(this.store.state);
        if (!selectors.editable(this.store.state) || activeSection == null) {
          break;
        }

        this.store.section.updateValue({
          sectionIndex: activeSection.index,
          newSectionValue: this.store.valueAdjustment.adjustActiveSectionValue(event.key),
          shouldGoToNextSection: false,
        });
        break;
      }
    }
  };

  public handleFocus = () => {
    if (
      this.store.dom.isFocused() ||
      selectors.disabled(this.store.state) ||
      !this.store.dom.inputRef.current
    ) {
      return;
    }

    const activeEl = this.store.dom.getActiveElement();

    // setFocused(true);

    const isFocusInsideASection =
      this.store.dom.isFocused() && this.store.dom.getSectionIndexFromDOMElement(activeEl) != null;
    if (!isFocusInsideASection) {
      this.store.section.setSelectedSections(0);
    }
  };

  public handleBlur = () => {
    setTimeout(() => {
      if (!this.store.dom.inputRef.current) {
        return;
      }

      const activeEl = this.store.dom.getActiveElement();
      const shouldBlur = !this.store.dom.inputRef.current.contains(activeEl);
      if (shouldBlur) {
        // setFocused(false);
        this.store.section.setSelectedSections(null);
      }
    });
  };

  public handleClick = (event: React.MouseEvent) => {
    if (selectors.disabled(this.store.state) || !this.store.dom.inputRef.current) {
      return;
    }

    // setFocused(true);

    if (!this.store.dom.isFocused()) {
      // setFocused(true);
      this.store.section.setSelectedSections(0);
    } else {
      const hasClickedOnASection = this.store.dom.inputRef.current.contains(event.target as Node);
      if (!hasClickedOnASection) {
        this.store.section.setSelectedSections(0);
      }
    }
  };

  public handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (!selectors.editable(this.store.state)) {
      event.preventDefault();
      return;
    }

    const pastedValue = event.clipboardData.getData('text');
    event.preventDefault();
    this.store.characterEditing.resetCharacterQuery();
    this.store.value.updateFromString(pastedValue);
  };
}

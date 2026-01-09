import { TemporalSupportedValue } from '../../../types';
import { TemporalFieldStore } from './TemporalFieldStore';

/**
 * Plugin to build the props to pass to the input element.
 */
export class TemporalFieldSectionPropsPlugin<TValue extends TemporalSupportedValue> {
  private store: TemporalFieldStore<TValue, any, any>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'sectionProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public handleClick(event: React.MouseEvent) {
    const { disabled } = this.store.state;
    // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
    // We avoid this by checking if the call to this function is actually intended, or a side effect.
    if (disabled || event.isDefaultPrevented()) {
      return;
    }

    const sectionIndex = domGetters.getSectionIndexFromDOMElement(event.target)!;
    this.store.section.setSelectedSections(sectionIndex);
  }

  public handleInput(event: React.FormEvent) {
    if (!domGetters.isReady()) {
      return;
    }

    const target = event.target as HTMLSpanElement;
    const keyPressed = target.textContent ?? '';
    const sectionIndex = domGetters.getSectionIndexFromDOMElement(target)!;

    const { readOnly } = this.store.state;

    if (readOnly) {
      this.revertDOMSectionChange(sectionIndex);
      return;
    }

    const section = this.store.section.selectors.section(this.store.state, sectionIndex);
    if (keyPressed.length === 0) {
      if (section.value === '') {
        this.revertDOMSectionChange(sectionIndex);
        return;
      }

      const inputType = (event.nativeEvent as InputEvent).inputType;
      if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') {
        this.revertDOMSectionChange(sectionIndex);
        return;
      }

      this.revertDOMSectionChange(sectionIndex);
      this.store.section.clearActive();
      return;
    }

    this.store.characterEditing.editSection({
      keyPressed,
      sectionIndex,
    });

    // The DOM value needs to remain the one React is expecting.
    this.revertDOMSectionChange(sectionIndex);
  }

  public handlePaste(event: React.ClipboardEvent) {
    // prevent default to avoid the input `onInput` handler being called
    event.preventDefault();

    const { readOnly, disabled } = this.store.state;
    const selectedSections = this.store.section.selectors.selectedSections(this.store.state);
    if (readOnly || disabled || selectedSections === 'all' || selectedSections == null) {
      return;
    }

    const activeSection = this.store.section.selectors.activeSection(this.store.state)!;
    const pastedValue = event.clipboardData.getData('text');
    const lettersOnly = /^[a-zA-Z]+$/.test(pastedValue);
    const digitsOnly = /^[0-9]+$/.test(pastedValue);
    const digitsAndLetterOnly = /^(([a-zA-Z]+)|)([0-9]+)(([a-zA-Z]+)|)$/.test(pastedValue);
    const isValidPastedValue =
      (activeSection.token.config.contentType === 'letter' && lettersOnly) ||
      (activeSection.token.config.contentType === 'digit' && digitsOnly) ||
      (activeSection.token.config.contentType === 'digit-with-letter' && digitsAndLetterOnly);

    if (isValidPastedValue) {
      this.store.characterEditing.resetCharacterQuery();
      this.store.section.updateValue({
        sectionIndex: selectedSections,
        newSectionValue: pastedValue,
        shouldGoToNextSection: true,
      });
    }
    // If the pasted value corresponds to a single section, but not the expected type, we skip the modification
    else if (!lettersOnly && !digitsOnly) {
      this.store.characterEditing.resetCharacterQuery();
      this.store.value.updateFromString(pastedValue);
    }
  }

  public handleMouseUp(event: React.MouseEvent) {
    // Without this, the browser will remove the selected when clicking inside an already-selected section.
    event.preventDefault();
  }

  public handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'none';
  }

  public handleFocus(event: React.FocusEvent) {
    const { disabled } = this.store.state;
    if (disabled) {
      return;
    }

    const sectionIndex = domGetters.getSectionIndexFromDOMElement(event.target)!;
    this.store.section.setSelectedSections(sectionIndex);
  }

  /**
   * If a section content has been updated with a value we don't want to keep,
   * Then we need to imperatively revert it (we can't let React do it because the value did not change in his internal representation).
   */
  private revertDOMSectionChange(sectionIndex: number) {
    if (!domGetters.isReady()) {
      return;
    }

    const section = this.store.section.selectors.section(this.store.state, sectionIndex);

    domGetters.getSectionContent(sectionIndex).innerHTML =
      this.store.section.getRenderedValue(section);
    syncSelectionToDOM({ focused, domGetters, stateResponse });
  }
}

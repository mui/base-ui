import { TemporalSupportedValue } from '../../../types';
import { selectors } from './selectors';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';
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

  public handleClick(event: React.MouseEvent<HTMLElement>) {
    // The click event on the clear button would propagate to the input, trigger this handler and result in a wrong section selection.
    // We avoid this by checking if the call to this function is actually intended, or a side effect.
    if (selectors.disabled(this.store.state) || event.isDefaultPrevented()) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target as HTMLElement)!;
    this.store.section.setSelectedSections(sectionIndex);
  }

  public handleInput(event: React.FormEvent) {
    const target = event.target as HTMLSpanElement;
    const keyPressed = target.textContent ?? '';
    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(target);
    if (sectionIndex == null) {
      return;
    }

    if (selectors.readOnly(this.store.state)) {
      this.store.dom.syncSectionContentToDOM(sectionIndex);
      return;
    }

    const section = TemporalFieldSectionPlugin.selectors.section(this.store.state, sectionIndex);
    if (keyPressed.length === 0) {
      if (section.value === '') {
        this.store.dom.syncSectionContentToDOM(sectionIndex);
        return;
      }

      const inputType = (event.nativeEvent as InputEvent).inputType;
      if (inputType === 'insertParagraph' || inputType === 'insertLineBreak') {
        this.store.dom.syncSectionContentToDOM(sectionIndex);
        return;
      }

      this.store.dom.syncSectionContentToDOM(sectionIndex);
      this.store.section.clearActive();
      return;
    }

    this.store.characterEditing.editSection({
      keyPressed,
      sectionIndex,
    });

    // The DOM value needs to remain the one React is expecting.
    this.store.dom.syncSectionContentToDOM(sectionIndex);
  }

  public handlePaste(event: React.ClipboardEvent) {
    // prevent default to avoid the input `onInput` handler being called
    event.preventDefault();

    const selectedSections = TemporalFieldSectionPlugin.selectors.selectedSections(
      this.store.state,
    );
    if (
      selectors.readOnly(this.store.state) ||
      selectors.disabled(this.store.state) ||
      selectedSections === 'all' ||
      selectedSections == null
    ) {
      return;
    }

    const activeSection = TemporalFieldSectionPlugin.selectors.activeSection(this.store.state)!;
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
    if (selectors.disabled(this.store.state)) {
      return;
    }

    const sectionIndex = this.store.dom.getSectionIndexFromDOMElement(event.target)!;
    this.store.section.setSelectedSections(sectionIndex);
  }
}

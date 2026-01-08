import { TemporalSupportedValue } from '../../../types';
import { selectors } from './selectors';
import { TemporalFieldStore } from './TemporalFieldStore';

/**
 * Plugin to build the props to pass to the input element.
 */
export class TemporalFieldInputPropsPlugin<TValue extends TemporalSupportedValue, TError> {
  private store: TemporalFieldStore<TValue, any, TError>;

  // We can't type `store`, otherwise we get the following TS error:
  // 'inputProps' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    const { disabled, readOnly } = this.store.state;
    const sections = selectors.sections<TValue>(this.store.state);
    const selectedSections = selectors.selectedSections(this.store.state);
    const activeSection = selectors.activeSection<TValue>(this.store.state);

    if (disabled) {
      return;
    }

    // eslint-disable-next-line default-case
    switch (true) {
      // Select all
      case (event.ctrlKey || event.metaKey) &&
        String.fromCharCode(event.keyCode) === 'A' &&
        !event.shiftKey &&
        !event.altKey: {
        // prevent default to make sure that the next line "select all" while updating
        // the internal state at the same time.
        event.preventDefault();
        this.store.section.setSelectedSections('all');
        break;
      }

      // Move selection to next section
      case event.key === 'ArrowRight': {
        event.preventDefault();

        if (selectedSections == null) {
          this.store.section.setSelectedSections(0);
        } else if (selectedSections === 'all') {
          this.store.section.setSelectedSections(sections.length - 1);
        } else if (selectedSections < sections.length - 1) {
          this.store.section.setSelectedSections(selectedSections + 1);
        }
        break;
      }

      // Move selection to previous section
      case event.key === 'ArrowLeft': {
        event.preventDefault();

        if (selectedSections == null) {
          this.store.section.setSelectedSections(sections.length - 1);
        } else if (selectedSections === 'all') {
          this.store.section.setSelectedSections(0);
        } else if (selectedSections > 0) {
          this.store.section.setSelectedSections(selectedSections - 1);
        }
        break;
      }

      // Reset the value of the selected section
      case event.key === 'Delete': {
        event.preventDefault();

        if (readOnly) {
          break;
        }

        if (selectedSections == null || selectedSections === 'all') {
          this.store.value.clear();
        } else {
          this.store.section.clearActive();
        }
        break;
      }

      // Increment / decrement the selected section value
      case this.store.valueAdjustment.isAdjustSectionValueKeyCode(event.key): {
        event.preventDefault();

        if (readOnly || activeSection == null) {
          break;
        }

        // if all sections are selected, mark the currently editing one as selected
        if (selectedSections === 'all') {
          this.store.section.setSelectedSections(activeSection.index);
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
    const { disabled } = this.store.state;
    if (focused || disabled || !this.store.inputRef.current) {
      return;
    }

    const activeEl = this.getActiveElement();

    setFocused(true);

    const isFocusInsideASection = domGetters.getSectionIndexFromDOMElement(activeEl) != null;
    if (!isFocusInsideASection) {
      this.store.section.setSelectedSections(0);
    }
  };

  public handleBlur = () => {
    setTimeout(() => {
      if (!this.store.inputRef.current) {
        return;
      }

      const activeEl = this.getActiveElement();
      const shouldBlur = !this.store.inputRef.current.contains(activeEl);
      if (shouldBlur) {
        setFocused(false);
        this.store.section.setSelectedSections(null);
      }
    });
  };

  public handleClick = (event: React.MouseEvent) => {
    const { disabled } = this.store.state;
    const sections = selectors.sections<TValue>(this.store.state);
    const selectedSections = selectors.selectedSections(this.store.state);

    if (disabled || !this.store.inputRef.current) {
      return;
    }

    setFocused(true);

    if (selectedSections === 'all') {
      this.store.timeoutManager.startInterval('containerClick', 0, () => {
        const cursorPosition = document.getSelection()!.getRangeAt(0).startOffset;

        if (cursorPosition === 0) {
          this.store.section.setSelectedSections(0);
          return;
        }

        let sectionIndex = 0;
        let cursorOnStartOfSection = 0;

        while (cursorOnStartOfSection < cursorPosition && sectionIndex < sections.length) {
          const section = sections[sectionIndex];
          sectionIndex += 1;
          cursorOnStartOfSection +=
            this.store.section.getRenderedValueWithSeparators(section).length;
        }

        this.store.section.setSelectedSections(sectionIndex - 1);
      });
    } else if (!focused) {
      setFocused(true);
      this.store.section.setSelectedSections(0);
    } else {
      const hasClickedOnASection = this.store.inputRef.current.contains(event.target as Node);

      if (!hasClickedOnASection) {
        this.store.section.setSelectedSections(0);
      }
    }
  };

  public handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const { readOnly } = this.store.state;
    const selectedSections = selectors.selectedSections(this.store.state);

    if (readOnly || selectedSections !== 'all') {
      event.preventDefault();
      return;
    }

    const pastedValue = event.clipboardData.getData('text');
    event.preventDefault();
    this.store.characterEditing.resetCharacterQuery();
    this.store.value.updateFromString(pastedValue);
  };

  public handleInput = (event: React.FormEvent<HTMLDivElement>) => {
    const selectedSections = selectors.selectedSections(this.store.state);
    const sections = selectors.sections<TValue>(this.store.state);

    if (!this.store.inputRef.current || selectedSections !== 'all') {
      return;
    }

    const target = event.target as HTMLSpanElement;
    const keyPressed = target.textContent ?? '';

    this.store.inputRef.current.innerHTML = sections
      .map((section) => this.store.section.getRenderedValueWithSeparators(section))
      .join('');
    syncSelectionToDOM({ focused, domGetters, stateResponse });

    if (keyPressed.length === 0 || keyPressed.charCodeAt(0) === 10) {
      this.store.value.clear();
      this.store.section.setSelectedSections('all');
    } else if (keyPressed.length > 1) {
      this.store.value.updateFromString(keyPressed);
    } else {
      if (selectedSections === 'all') {
        this.store.section.setSelectedSections(0);
      }
      this.store.characterEditing.editSection({
        keyPressed,
        sectionIndex: 0,
      });
    }
  };
}

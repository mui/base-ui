import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { TemporalFieldStore } from './TemporalFieldStore';
import { activeElement } from '../../../floating-ui-react/utils';
import { TemporalFieldSectionPlugin } from './TemporalFieldSectionPlugin';

/**
 * Plugin to interact with the DOM of the field.
 */
export class TemporalFieldDOMPlugin {
  private store: TemporalFieldStore<any, any, any>;

  public inputRef = React.createRef<HTMLElement>();

  private sectionElementMap = new Map<number, HTMLElement>();

  // We can't type `store`, otherwise we get the following TS error:
  // 'dom' implicitly has type 'any' because it does not have a type annotation and is referenced directly or indirectly in its own initializer.
  constructor(store: any) {
    this.store = store;
  }

  public getActiveElement() {
    const doc = ownerDocument(this.inputRef.current);
    return activeElement(doc);
  }

  public getSectionIndexFromDOMElement(element: Element | null | undefined) {
    if (element == null) {
      return null;
    }

    const indexStr = (element as HTMLElement).dataset?.sectionIndex;
    if (indexStr == null) {
      return null;
    }

    return Number(indexStr);
  }

  public isFocused() {
    return !!this.inputRef.current?.contains(this.getActiveElement());
  }

  public registerSection = (sectionElement: HTMLDivElement | null) => {
    const index = this.getSectionIndexFromDOMElement(sectionElement);
    if (index == null) {
      return undefined;
    }

    this.sectionElementMap.set(index, sectionElement!);
    return () => this.sectionElementMap.delete(index);
  };

  /**
   * Updates the content of a section in the DOM to match the store state.
   * This is needed to revert unwanted change made when the section has contentEditable enabled.
   */
  public syncSectionContentToDOM(sectionIndex: number) {
    const sectionElement = this.getSectionElement(sectionIndex);
    if (sectionElement == null) {
      return;
    }

    const section = TemporalFieldSectionPlugin.selectors.section(this.store.state, sectionIndex);
    sectionElement.innerHTML = this.store.section.getRenderedValue(section);
    this.store.dom.syncSelectionToDOM();
  }

  public syncSelectionToDOM = () => {
    if (!this.inputRef.current) {
      return;
    }

    const selection = ownerDocument(this.inputRef.current).getSelection();
    if (!selection) {
      return;
    }

    const selectedSections = TemporalFieldSectionPlugin.selectors.selectedSections(
      this.store.state,
    );
    if (selectedSections == null) {
      // If the selection contains an element inside the field, we reset it.
      if (
        selection.rangeCount > 0 &&
        // Firefox can return a Restricted object here
        selection.getRangeAt(0).startContainer instanceof Node &&
        this.inputRef.current.contains(selection.getRangeAt(0).startContainer)
      ) {
        selection.removeAllRanges();
      }

      if (this.isFocused()) {
        this.inputRef.current.blur();
      }
      return;
    }

    // On multi input range pickers we want to update selection range only for the active input
    if (!this.inputRef.current.contains(this.getActiveElement())) {
      return;
    }

    const range = new window.Range();
    const target = this.getSectionElement(selectedSections);
    if (target == null) {
      return;
    }

    range.selectNodeContents(target);
    target.focus();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  private getSectionElement(sectionIndex: number) {
    return this.sectionElementMap.get(sectionIndex) ?? null;
  }
}

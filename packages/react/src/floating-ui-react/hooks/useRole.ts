'use client';
import * as React from 'react';
import { useId } from '@base-ui/utils/useId';
import { EMPTY_OBJECT } from '@base-ui/utils/empty';
import { getFloatingFocusElement } from '../utils/element';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import type { ElementProps, FloatingContext, FloatingRootContext } from '../types';
import type { ExtendedUserProps } from './useInteractions';

type AriaRole = 'tooltip' | 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'grid' | 'tree';
type ComponentRole = 'select' | 'label' | 'combobox';

export interface UseRoleProps {
  /**
   * The role of the floating element.
   * @default 'dialog'
   */
  role?: AriaRole | ComponentRole | undefined;
}

const componentRoleToAriaRoleMap = new Map<AriaRole | ComponentRole, AriaRole | false>([
  ['select', 'listbox'],
  ['combobox', 'listbox'],
  ['label', false],
]);

/**
 * Adds base screen reader props to the reference and floating elements for a
 * given floating element `role`.
 * @see https://floating-ui.com/docs/useRole
 */
export function useRole(
  context: FloatingRootContext | FloatingContext,
  props: UseRoleProps = {},
): ElementProps {
  const { role = 'dialog' } = props;

  const store = 'rootStore' in context ? context.rootStore : context;

  const open = store.useState('open');
  const defaultFloatingId = store.useState('floatingId');
  const domReference = store.useState('domReferenceElement');
  const floatingElement = store.useState('floatingElement');

  const defaultReferenceId = useId();
  const parentId = useFloatingParentNodeId();
  const floatingId = React.useMemo(
    () => getFloatingFocusElement(floatingElement)?.id || defaultFloatingId,
    [floatingElement, defaultFloatingId],
  );

  const referenceId = domReference?.id || defaultReferenceId;
  const ariaRole = (componentRoleToAriaRoleMap.get(role) ?? role) as AriaRole | false | undefined;
  const isNested = parentId != null;

  const trigger: ElementProps['trigger'] = React.useMemo(() => {
    if (ariaRole === 'tooltip' || role === 'label') {
      return EMPTY_OBJECT;
    }

    return {
      'aria-haspopup': ariaRole === 'alertdialog' ? 'dialog' : ariaRole,
      'aria-expanded': 'false',
      ...(ariaRole === 'listbox' && { role: 'combobox' }),
      ...(ariaRole === 'menu' && isNested && { role: 'menuitem' }),
      ...(role === 'select' && { 'aria-autocomplete': 'none' }),
      ...(role === 'combobox' && { 'aria-autocomplete': 'list' }),
    };
  }, [ariaRole, isNested, role]);

  const reference: ElementProps['reference'] = React.useMemo(() => {
    if (ariaRole === 'tooltip' || role === 'label') {
      return {
        [`aria-${role === 'label' ? 'labelledby' : 'describedby'}`]: open ? floatingId : undefined,
      };
    }

    return {
      ...trigger,
      'aria-expanded': open ? 'true' : 'false',
      'aria-controls': open ? floatingId : undefined,
      ...(ariaRole === 'menu' && { id: referenceId }),
    };
  }, [ariaRole, floatingId, open, referenceId, role, trigger]);

  const floating: ElementProps['floating'] = React.useMemo(() => {
    const floatingProps = {
      id: floatingId,
      ...(ariaRole && { role: ariaRole }),
    };

    if (ariaRole === 'tooltip' || role === 'label') {
      return floatingProps;
    }

    return {
      ...floatingProps,
      ...(ariaRole === 'menu' && {
        'aria-labelledby': referenceId,
      }),
    };
  }, [ariaRole, floatingId, referenceId, role]);

  const item: ElementProps['item'] = React.useCallback(
    ({ active, selected }: ExtendedUserProps) => {
      // For `menu`, we are unable to tell if the item is a `menuitemradio`
      // or `menuitemcheckbox`. For backwards-compatibility reasons, also
      // avoid defaulting to `menuitem` as it may overwrite custom role props.
      if (role !== 'select' && role !== 'combobox') {
        return {};
      }

      return {
        role: 'option',
        ...(active && { id: `${floatingId}-fui-option` }),
        'aria-selected': selected,
      };
    },
    [floatingId, role],
  );

  return React.useMemo(
    () => ({ reference, floating, item, trigger }),
    [reference, floating, trigger, item],
  );
}

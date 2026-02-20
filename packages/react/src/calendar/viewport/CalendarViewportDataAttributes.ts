import { TransitionStatusDataAttributes } from '../../utils/stateAttributesMapping';

export enum CalendarViewportDataAttributes {
  /**
   * Applied to the direct child of the viewport when no transitions are present or the new content when it's entering.
   */
  current = 'data-current',
  /**
   * Applied to the direct child of the viewport that contains the exiting content when transitions are present.
   */
  previous = 'data-previous',
  /**
   * Indicates the direction of the navigation (based on the month navigating to).
   * @type {'previous' | 'next' | 'none'}
   */
  navigationDirection = 'data-navigation-direction',
  /**
   * Present when the day grid body is animating in.
   */
  startingStyle = TransitionStatusDataAttributes.startingStyle,
  /**
   * Present when the day grid body is animating out.
   */
  endingStyle = TransitionStatusDataAttributes.endingStyle,
}

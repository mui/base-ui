import { apple } from './os';
import { webkit } from './engine';

// Whether a screen reader is *actually* running cannot be detected. These flags
// identify platforms where a specific screen reader's accessibility quirks
// would apply if it were active.
//
// VoiceOver moves browser focus as its virtual cursor moves and only triggers
// `onFocus` on focusable/role-button elements via WebKit's NSAccessibility
// path. That path only exists on Apple platforms running WebKit — Chrome on
// macOS uses Blink and has a different AX integration.
/**
 * The user *may* be using VoiceOver — actual activation is not detectable.
 * True on Apple platforms running WebKit, where VoiceOver's virtual-cursor /
 * NSAccessibility focus quirks apply.
 */
export const voiceOver = apple && webkit;

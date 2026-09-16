export { DropTargetRoot as Root } from './root/DropTargetRoot';

// Also on this namespace, not only on `Draggable`: a drop-target-only or
// monitor-only module needs the factory to declare what it accepts, and having
// to import `@base-ui/react/draggable` for it is a needless dependency (the
// package's own `DropTargetRoot.spec.tsx` did exactly that). Same function, so
// kinds created either way share the same factory semantics.
export {
  createKind,
  createGlobalKind,
  anyDragKind as anyKind,
} from '../utils/drag-and-drop/dragKind';

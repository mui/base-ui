/**
 * Locks the scroll of the document when enabled.
 *
 * @param enabled - Whether to enable the scroll lock.
 */
export declare function useScrollLock(params: {
    enabled: boolean;
    mounted: boolean;
    open: boolean;
    referenceElement?: Element | null;
}): void;

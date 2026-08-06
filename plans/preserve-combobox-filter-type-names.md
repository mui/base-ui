# Preserve combobox filter type names

Plan Summary:

- Goal: Preserve the established `AutocompleteFilter` and `ComboboxFilter` names in generated API documentation after introducing a narrow internal item matcher.
- Public contract: The existing public aliases and generated documentation names remain unchanged.
- Clarification decisions: Restore the shared filter collection's original `Filter` name and name the private matcher `ItemFilter`; do not add public wrapper types.
- Assumptions: This is a type-only naming correction with no runtime behavior change.
- Risks: Missing an internal import could break declarations or expose the private matcher name.

Slice S1:

- Behavior: Consumers continue to see `AutocompleteFilter` and `ComboboxFilter` in the generated API reference.
- Includes: Internal type names, public re-export aliases, generated-doc verification, type checking, focused tests, and lint.
- Task type: Public type documentation correction.
- Prompt complexity: low
- Delivery role: mid
- Review role: reviewer-final
- Role rationale: The runtime is unchanged, but public alias resolution must remain consistent across two components.
- Out-of-scope/Cleanup: Changes to filter behavior or the unrelated Select lint failure.

Recommended Next Slice:

- Slice ID: S1
- Why now: It fully restores the public documentation contract in one reviewable change.

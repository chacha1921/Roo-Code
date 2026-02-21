# CLAUDE.md - Shared Agent Knowledge Base

## Lessons Learned

- **Hook Integration:** When modifying `Cline.ts`, always ensure the original tool result is returned if the hook logic passes.
- **YAML Parsing:** Use `js-yaml` for robust parsing; regex is insufficient for nested structures.

## Stylistic Rules

- **Types:** Always define strict interfaces in `src/hooks/types.ts`.
- **Logs:** Use structured JSON format for all trace logs.

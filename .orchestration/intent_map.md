# Intent Map

This file maps high-level business intents to the physical codebase structure.

## INT-001: Implement Hook Middleware

- **Owner:** Backend Team
- **Key Files:**
    - `src/hooks/HookEngine.ts`: Main singleton.
    - `src/hooks/PreTools/IntentCheck.ts`: Validation logic.
    - `src/core/Cline.ts`: Integration point.

## INT-002: Refactor Authentication

- **Owner:** Security Team
- **Key Files:**
    - `src/auth/AuthProvider.ts`

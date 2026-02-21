# Shared Machine Knowledge Base

> **Auto-Generated Artifact**: This file is managed by the AI coding agent to persist learned patterns, debugging insights, and project-specific constraints. It serves as a dynamic "long-term memory" across sessions.

## 🧠 Project Vocabulary & Concepts

| Term           | Definition                                                                                                                          | Context               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `ContextProxy` | Custom state wrapper that handles VSCode extension storage persistence. DO NOT use raw `vscode.memento` directly for user settings. | `src/core/State.ts`   |
| `RooIgnore`    | Specialized `.gitignore`-like parser for preventing the agent from reading sensitive files. Must be checked before every file read. | `src/utils/ignore.ts` |
| `MCP`          | Model Context Protocol. Used for connecting external tools. Requires rigid schema validation for all tool inputs.                   | `src/services/mcp/*`  |

## 🏗️ Architectural Patterns

### State Synchronization

- **Pattern**: The extension logic is the source of truth. The React webview is a "dumb" renderer.
- **Rule**: Never mutate state directly in the webview. Always dispatch a message to the extension backend to request a state change.
- **Reasoning**: Ensures consistency across VSCode window reloads and prevents race conditions.

### Tool Implementation

- **Pattern**: Tools are defined as strict JSON schemas.
- **Rule**: All new tools must include a `zod` schema definition AND a corresponding type interface in `src/shared/types.ts`.
- **Observation**: Loose typing in tool definitions leads to runtime errors in the MCP bridge.

## 🛡️ Implementation Constraints

1. **Webview Security**:

    - CSP (Content Security Policy) is strictly enforced in `src/extension/utils/getHtmlForWebview.ts`.
    - External scripts (CDNs) are blocked. All resources must be bundled or served from the extension execution path.

2. **File Access**:
    - The agent cannot access files outside the workspace root unless explicitly allowed by the user via the `allow-fs-read` permission.
    - Always use absolute paths when calling `fs` methods.

## 🐛 Debugging Insights

- **Issue**: "Webview is blank after build"

    - **Cause**: Mismatched message passing types between `ExtensionMessage` and `WebviewMessage`.
    - **Fix**: Run `pnpm run type-check` to validate the shared types in both the `extension` and `webview-ui` workspaces.

- **Issue**: "MCP Tool not found"
    - **Cause**: The tool was added to the `ToolName` enum but not registered in the `ToolManager` map.
    - **Fix**: Update `src/services/mcp/ToolManager.ts` to include the new tool instance.

## 📈 Performance Characteristics

- **Build Times**:
    - `webview-ui`: ~4s (Vite)
    - `extension`: ~8s (esbuild)
- **Bottlenecks**: Reference searching in large workspaces (e.g., `semantic_search`) can accept up to 10s. Prefer `grep_search` for known patterns.

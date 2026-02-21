import { Intent } from "../types"
import * as path from "path"

export class ScopeCheck {
	static async validate(intent: Intent, filePath: string, workspaceRoot: string): Promise<boolean | string> {
		// Safe commands (read-only) pass through if you want, but this is usually for writes.
		// Assuming this is called for write_to_file/edit...

		const ownedScopes = intent.owned_scope || []

		// Normalize path separator to forward slashes for easier comparison
		let normalizedPath = filePath.replace(/\\/g, "/")

		const isAuthorized = ownedScopes.some((scopePattern) => {
			const normalizedScope = scopePattern.replace(/\\/g, "/")

			// 1. Recursive wildcard (e.g., "src/hooks/**")
			if (normalizedScope.endsWith("/**")) {
				const prefix = normalizedScope.slice(0, -3)
				// allowed if filePath starts with "src/hooks/"
				return normalizedPath.startsWith(prefix)
			}

			// 2. Exact match (e.g., "src/core/Cline.ts")
			if (normalizedPath === normalizedScope) {
				return true
			}

			return false
		})

		if (!isAuthorized) {
			return `Scope Violation: Intent '${intent.id}' is not authorized to edit [${filePath}]. Authorized scopes: ${ownedScopes.join(", ")}. Request scope expansion.`
		}

		return true
	}
}

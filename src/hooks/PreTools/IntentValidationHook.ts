import { Hook, HookContext, ToolInput } from "../types"
import { ScopeCheck } from "./ScopeCheck"

export class IntentValidationHook implements Hook {
	name = "IntentValidationHook"

	async onPreAction(context: HookContext, input: ToolInput): Promise<void> {
		const { toolName, args } = input

		// Only run checks for modification tools
		if (toolName === "write_to_file" || toolName === "edit" || toolName === "apply_diff") {
			const intent = context.activeIntent

			// If no intent is active, warn/block.
			if (!intent) {
				throw new Error("No active intent selected. Please use 'select_active_intent' tool first.")
			}

			// Check if intent status is IN_PROGRESS
			if (intent.status !== "IN_PROGRESS") {
				throw new Error(`Active intent '${intent.id}' is not in IN_PROGRESS status.`)
			}

			// Scope Enforcement
			// Only check for write operations that have a path argument
			const filePath = args.path || args.file_path
			if (filePath) {
				const scopeResult = await ScopeCheck.validate(intent, filePath, context.workspaceRoot)
				if (scopeResult !== true) {
					throw new Error(scopeResult as string)
				}
			}

			console.log(`[IntentValidationHook] Pre-check passed for ${toolName} under intent ${intent.id}`)
		}
	}
}

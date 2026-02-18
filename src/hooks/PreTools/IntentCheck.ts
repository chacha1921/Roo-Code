import { HookEngine } from "../HookEngine"
import { Intent } from "../types"
import { OrchestrationManager } from "../../services/orchestration/OrchestrationManager"

export class IntentCheck {
	static async validate(intentId: string, workspaceRoot: string): Promise<Intent | string> {
		if (!intentId) {
			return "Error: You must provide a valid Intent ID."
		}

		const orchestration = new OrchestrationManager(workspaceRoot)
		const intent = await orchestration.getIntent(intentId)

		if (!intent) {
			return `Error: Intent ID '${intentId}' not found in active_intents.yaml.`
		}

		if (intent.status !== "IN_PROGRESS") {
			return `Error: Intent '${intentId}' is not in IN_PROGRESS status (${intent.status}).`
		}

		return intent
	}
}

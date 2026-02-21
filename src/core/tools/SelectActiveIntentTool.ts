import { BaseTool, ToolCallbacks } from "./BaseTool"
import { Task } from "../task/Task"
import { HookEngine } from "../../hooks/HookEngine"
import { IntentCheck } from "../../hooks/PreTools/IntentCheck"

interface SelectActiveIntentParams {
	intent_id: string
}

export class SelectActiveIntentTool extends BaseTool<"select_active_intent"> {
	readonly name = "select_active_intent"

	async execute(params: SelectActiveIntentParams, task: Task, callbacks: ToolCallbacks): Promise<void> {
		const { pushToolResult, handleError } = callbacks
		const intentId = params.intent_id

		if (!intentId) {
			pushToolResult(await task.sayAndCreateMissingParamError("select_active_intent", "intent_id"))
			return
		}

		try {
			// Use IntentCheck to validate the ID against the YAML
			const result = await IntentCheck.validate(intentId, task.workspacePath)

			if (typeof result === "string") {
				// Validation failed with error message
				pushToolResult(`Error selecting intent: ${result}`)
				return
			}

			// Success: Update the HookEngine's context
			const engine = HookEngine.getInstance()
			engine.setContext({ workspaceRoot: task.workspacePath })
			engine.setActiveIntent(result)

			pushToolResult(`Successfully activated intent: ${result.id} - ${result.name}`)
		} catch (error) {
			await handleError("activating intent", error)
		}
	}
}

export const selectActiveIntentTool = new SelectActiveIntentTool()

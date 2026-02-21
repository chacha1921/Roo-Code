import { BaseTool, ToolCallbacks } from "./BaseTool"
import { Task } from "../task/Task"
import { OrchestrationManager } from "../../services/orchestration/OrchestrationManager"

interface GetCuratedContextParams {
	intent_id: string
	token_budget?: string
}

export class GetCuratedContextTool extends BaseTool<"get_curated_context"> {
	readonly name = "get_curated_context"

	async execute(params: GetCuratedContextParams, task: Task, callbacks: ToolCallbacks): Promise<void> {
		const { pushToolResult, handleError } = callbacks
		const intentId = params.intent_id
		const budget = params.token_budget ? parseInt(params.token_budget, 10) : 2000

		if (!intentId) {
			pushToolResult(await task.sayAndCreateMissingParamError("get_curated_context", "intent_id"))
			return
		}

		try {
			const manager = new OrchestrationManager(task.workspacePath)
			const content = await manager.getCuratedContext(intentId, budget)
			pushToolResult(content)
		} catch (error) {
			await handleError("getting curated context", error)
		}
	}
}

export const getCuratedContextTool = new GetCuratedContextTool()

import { Hook, HookContext, ToolInput } from "../types"
import { TraceLogger } from "./TraceLogger"

export class TraceLoggerHook implements Hook {
	name = "TraceLoggerHook"

	async onPostAction(context: HookContext, input: ToolInput): Promise<void> {
		const { toolName, args } = input

		if (toolName === "write_to_file" && context.activeIntent) {
			const intentId = context.activeIntent.id
			const filePath = args.path
			const content = args.content

			// Use the existing static method from TraceLogger or reimplement here.
			// Since TraceLogger relies on HookEngine.getInstance(), calling it directly is circular if HookEngine registers this hook.
			// We should call TraceLogger logic directly OR update TraceLogger to take context as arg.
			// For now, let's look at TraceLogger again. It calls HookEngine.getInstance() just for context.
			// But we have context passed in! So we can refactor TraceLogger logic here slightly.

			await TraceLogger.log(filePath, content, intentId)
		}
	}
}

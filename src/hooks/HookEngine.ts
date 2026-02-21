import { Intent, HookContext } from "./types"
import { IntentCheck } from "./PreTools/IntentCheck"
import { TraceLogger } from "./PostTools/TraceLogger"
import { ScopeCheck } from "./PreTools/ScopeCheck"

export class HookEngine {
	private static instance: HookEngine
	private _context: HookContext = {
		workspaceRoot: "",
	}

	private constructor() {}

	public static getInstance(): HookEngine {
		if (!HookEngine.instance) {
			HookEngine.instance = new HookEngine()
		}
		return HookEngine.instance
	}

	public setContext(context: Partial<HookContext>) {
		this._context = { ...this._context, ...context }
	}

	public get context(): HookContext {
		return this._context
	}

	public setActiveIntent(intent: Intent) {
		this._context.activeIntent = intent
	}

	public async onPreToolExecution(toolName: string, args: any): Promise<void> {
		// Only run checks for modification tools
		if (toolName === "write_to_file" || toolName === "edit" || toolName === "apply_diff") {
			const intent = this._context.activeIntent

			// If no intent is active, warn/block.
			if (!intent) {
				throw new Error("No active intent selected. Please use 'select_active_intent' tool first.")
			}

			// Check if intent status is IN_PROGRESS
			if (intent.status !== "IN_PROGRESS") {
				throw new Error(`Active intent '${intent.id}' is not in IN_PROGRESS status.`)
			}

			// Phase 2: Scope Enforcement
			// Only check for write operations that have a path argument
			const filePath = args.path || args.file_path
			if (filePath) {
				const scopeResult = await ScopeCheck.validate(intent, filePath, this._context.workspaceRoot)
				if (scopeResult !== true) {
					throw new Error(scopeResult as string)
				}
			}

			console.log(`[HookEngine] Pre-check for ${toolName} under intent ${intent.id}`)
		}
	}

	public async onPostToolExecution(toolName: string, args: any, result: string): Promise<void> {
		if (toolName === "write_to_file" && this._context.activeIntent) {
			const intentId = this._context.activeIntent.id
			const filePath = args.path
			const content = args.content

			await TraceLogger.log(filePath, content, intentId)
		}
	}
}

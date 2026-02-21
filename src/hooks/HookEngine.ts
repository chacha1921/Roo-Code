import { Intent, HookContext, Hook, ToolInput } from "./types"
import { IntentValidationHook } from "./PreTools/IntentValidationHook"
import { TraceLoggerHook } from "./PostTools/TraceLoggerHook"

export class HookEngine {
	private static instance: HookEngine
	private _context: HookContext = {
		workspaceRoot: "",
	}
	private _hooks: Hook[] = []

	private constructor() {
		// Register default hooks
		this.registerHook(new IntentValidationHook())
		this.registerHook(new TraceLoggerHook())
	}

	public static getInstance(): HookEngine {
		if (!HookEngine.instance) {
			HookEngine.instance = new HookEngine()
		}
		return HookEngine.instance
	}

	public registerHook(hook: Hook) {
		this._hooks.push(hook)
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
		const input: ToolInput = { toolName, args }

		for (const hook of this._hooks) {
			if (hook.onPreAction) {
				try {
					await hook.onPreAction(this._context, input)
				} catch (error: any) {
					console.error(`[HookEngine] Error in pre-hook '${hook.name}':`, error)
					// Re-throw to block execution for critical checks
					throw error
				}
			}
		}
	}

	public async onPostToolExecution(toolName: string, args: any, result: string): Promise<void> {
		const input: ToolInput = { toolName, args, result }

		for (const hook of this._hooks) {
			if (hook.onPostAction) {
				try {
					await hook.onPostAction(this._context, input)
				} catch (error) {
					// Isolate errors in post-hooks so they don't break the flow
					console.error(`[HookEngine] Error in post-hook '${hook.name}':`, error)
				}
			}
		}
	}
}

import { Intent, HookContext } from "./types"

export class HookEngine {
	private static instance: HookEngine
	private context: HookContext

	private constructor() {
		this.context = {
			workspaceRoot: "", // Will be set on init
		}
	}

	public static getInstance(): HookEngine {
		if (!HookEngine.instance) {
			HookEngine.instance = new HookEngine()
		}
		return HookEngine.instance
	}

	public setContext(context: Partial<HookContext>) {
		this.context = { ...this.context, ...context }
	}

	public getContext(): HookContext {
		return this.context
	}
}

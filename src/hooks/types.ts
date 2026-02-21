export interface Intent {
	id: string
	name: string
	status: "TODO" | "IN_PROGRESS" | "DONE"
	owned_scope: string[]
	constraints: string[]
	acceptance_criteria: string[]
}

export interface AgentTrace {
	id: string
	timestamp: string
	intent_id: string
	file_path: string
	content_hash: string
	diff?: string
}

export interface HookContext {
	activeIntent?: Intent
	workspaceRoot: string
}

export interface ToolInput {
	toolName: string
	args: any
	result?: any
	error?: unknown
}

export interface Hook {
	name: string
	onPreAction?(context: HookContext, input: ToolInput): Promise<void>
	onPostAction?(context: HookContext, input: ToolInput): Promise<void>
}

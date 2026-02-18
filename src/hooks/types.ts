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

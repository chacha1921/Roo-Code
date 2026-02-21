import { Hook, HookContext, ToolInput, AgentTrace } from "../types"
import { ContentHasher } from "./ContentHasher"
import { OrchestrationManager } from "../../services/orchestration/OrchestrationManager"
import * as crypto from "crypto"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export class TraceLoggerHook implements Hook {
	name = "TraceLoggerHook"

	private async getGitRevision(workspaceRoot: string): Promise<string> {
		try {
			const { stdout } = await execAsync("git rev-parse HEAD", { cwd: workspaceRoot })
			return stdout.trim()
		} catch (e) {
			console.warn("[TraceLoggerHook] Failed to get git revision:", e)
			return "unknown"
		}
	}

	private determineMutationClass(content: string, toolName: string): "refactor" | "feature" | "fix" | "unknown" {
		// Heuristic: Check for common patterns indicating type of change.

		// If using apply_diff, likely a refactor or fix
		if (toolName === "apply_diff") return "refactor"

		// If new file content is small -> possibly a fix or config change
		if (content.length < 50) return "fix"

		// Detailed heuristics could go here (AST traversing, etc.)
		// For now, default to feature if it's a substantial write
		return "feature"
	}

	async onPostAction(context: HookContext, input: ToolInput): Promise<void> {
		const { toolName, args } = input

		if ((toolName === "write_to_file" || toolName === "apply_diff") && context.activeIntent) {
			const intent = context.activeIntent
			const filePath = args.path || args.file_path
			// For write_to_file, content is in args.content
			// For apply_diff, we might not have the full new content easily unless we read the file.
			// Ideally we read the file from disk since this is a post-hook (change happened).
			let content = args.content || ""

			// Calculate hash
			const hash = ContentHasher.hash(content)

			// Get Git Revision
			const gitRev = await this.getGitRevision(context.workspaceRoot)

			// Collect specs
			const specRefs = [...(intent.constraints || []), ...(intent.acceptance_criteria || [])]

			const traceEntry: AgentTrace = {
				id: crypto.randomUUID(),
				timestamp: new Date().toISOString(),
				intent_id: intent.id,
				file_path: filePath,
				content_hash: hash,
				mutation_class: this.determineMutationClass(content, toolName),
				git_rev: gitRev,
				spec_refs: specRefs,
			}

			if (context.workspaceRoot) {
				const orchestrator = new OrchestrationManager(context.workspaceRoot)
				await orchestrator.logTrace(traceEntry)
			} else {
				console.log("Logged Trace (Console):", traceEntry)
			}
		}
	}
}

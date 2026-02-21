import { HookEngine } from "../HookEngine"
import * as crypto from "crypto"
import { ContentHasher } from "./ContentHasher"
import { OrchestrationManager } from "../../services/orchestration/OrchestrationManager"

export class TraceLogger {
	static async log(filePath: string, content: string, intentId: string) {
		const hash = ContentHasher.hash(content)
		const traceEntry = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			intent_id: intentId,
			file_path: filePath,
			content_hash: hash,
		}

		// Use OrchestrationManager to append to JSONL if context available
		const engine = HookEngine.getInstance()
		const context = engine.context
		if (context.workspaceRoot) {
			const orchestrator = new OrchestrationManager(context.workspaceRoot)
			await orchestrator.logTrace(traceEntry)
		} else {
			console.log("Logged Trace (Console):", traceEntry)
		}
	}
}

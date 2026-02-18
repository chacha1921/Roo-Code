import * as fs from "fs/promises"
import * as path from "path"
import * as yaml from "js-yaml"
import { Intent, AgentTrace } from "../../hooks/types"

export class OrchestrationManager {
	private orchestrationDir: string
	private intentsFile: string
	private traceFile: string

	constructor(workspaceRoot: string) {
		this.orchestrationDir = path.join(workspaceRoot, ".orchestration")
		this.intentsFile = path.join(this.orchestrationDir, "active_intents.yaml")
		this.traceFile = path.join(this.orchestrationDir, "agent_trace.jsonl")
	}

	async ensureOrchestrationDir(): Promise<void> {
		try {
			await fs.access(this.orchestrationDir)
		} catch {
			await fs.mkdir(this.orchestrationDir, { recursive: true })
		}
	}

	async getActiveIntents(): Promise<Intent[]> {
		await this.ensureOrchestrationDir()
		try {
			const content = await fs.readFile(this.intentsFile, "utf8")
			if (!content) return []

			const parsed = yaml.load(content) as any
			if (parsed && Array.isArray(parsed.active_intents)) {
				return parsed.active_intents as Intent[]
			}
			return []
		} catch (error) {
			// File might not exist yet or invalid yaml
			return []
		}
	}

	async getIntent(id: string): Promise<Intent | undefined> {
		// Mock implementation for the skeleton
		const intents = await this.getActiveIntents()
		return intents.find((i) => i.id === id)
	}

	async logTrace(trace: AgentTrace): Promise<void> {
		await this.ensureOrchestrationDir()
		const line = JSON.stringify(trace) + "\n"
		await fs.appendFile(this.traceFile, line, "utf8")
	}
}

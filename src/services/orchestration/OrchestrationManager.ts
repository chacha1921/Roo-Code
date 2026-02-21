import * as fs from "fs/promises"
import * as path from "path"
import * as yaml from "js-yaml"
import { Intent, AgentTrace } from "../../hooks/types"

export class OrchestrationManager {
	private orchestrationDir: string
	private intentsFile: string
	private traceFile: string
	private intentMapFile: string
	private technicalContextFile: string
	private sharedBrainFile: string

	constructor(workspaceRoot: string) {
		this.orchestrationDir = path.join(workspaceRoot, ".orchestration")
		this.intentsFile = path.join(this.orchestrationDir, "active_intents.yaml")
		this.traceFile = path.join(this.orchestrationDir, "agent_trace.jsonl")
		this.intentMapFile = path.join(this.orchestrationDir, "intent_map.md")
		this.technicalContextFile = path.join(this.orchestrationDir, "technical_context.md")
		this.sharedBrainFile = path.join(this.orchestrationDir, "shared_brain.md")
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

	async getCuratedContext(intentId: string, tokenBudget: number = 2000): Promise<string> {
		const intent = await this.getIntent(intentId)
		if (!intent) {
			return `<error>Intent '${intentId}' not found.</error>`
		}

		let context = `<intent_context>\n`
		context += `  <active_intent>\n`
		context += `    <id>${intent.id}</id>\n`
		context += `    <status>${intent.status}</status>\n`
		context += `    <files>\n${intent.owned_scope.map((s) => `      - ${s}`).join("\n")}\n    </files>\n`
		context += `    <constraints>\n${intent.constraints.map((c) => `      - ${c}`).join("\n")}\n    </constraints>\n`
		context += `  </active_intent>\n`

		// Add Intent Map section
		try {
			const mapContent = await fs.readFile(this.intentMapFile, "utf8")
			const intentSection = this.extractSection(mapContent, `## ${intentId}`)
			if (intentSection) {
				context += `  <spatial_map>\n${intentSection}\n  </spatial_map>\n`
			}
		} catch {}

		// Add recent Technical Context
		try {
			const techContent = await fs.readFile(this.technicalContextFile, "utf8")
			// Simple heuristic: get last 2 decisions
			const lines = techContent.split("\n")
			const recentDecisions = lines.slice(-20).join("\n") // Last 20 lines as proxy
			context += `  <technical_context>\n${recentDecisions}\n  </technical_context>\n`
		} catch {}

		// Add Shared Brain relevant patterns (naive simulation)
		try {
			const brainContent = await fs.readFile(this.sharedBrainFile, "utf8")
			// Just grab the Vocabulary section for now as generic context
			const vocabSection = this.extractSection(brainContent, "## 🧠 Project Vocabulary")
			if (vocabSection) {
				context += `  <shared_memory>\n${vocabSection}\n  </shared_memory>\n`
			}
		} catch {}

		context += `</intent_context>`

		// Token Budget Truncation (approx 4 chars per token)
		const maxChars = tokenBudget * 4
		if (context.length > maxChars) {
			return context.substring(0, maxChars) + "\n... (truncated)"
		}

		return context
	}

	private extractSection(content: string, header: string): string | null {
		const lines = content.split("\n")
		const startIndex = lines.findIndex((l) => l.includes(header))
		if (startIndex === -1) return null

		// Find next header of same level or higher (## or #)
		const endIndex = lines.findIndex((l, i) => i > startIndex && l.trim().startsWith("#"))

		if (endIndex === -1) {
			return lines.slice(startIndex).join("\n")
		}
		return lines.slice(startIndex, endIndex).join("\n")
	}
}

import type OpenAI from "openai"

const select_active_intent: OpenAI.Chat.ChatCompletionTool = {
	type: "function",
	function: {
		name: "select_active_intent",
		description: `Select an active intent from the project's .orchestration/active_intents.yaml. This MUST be called before writing any code or executing destructive commands.`,
		strict: true,
		parameters: {
			type: "object",
			properties: {
				intent_id: {
					type: "string",
					description: "The ID of the intent to activate (e.g., 'INT-001')",
				},
			},
			required: ["intent_id"],
			additionalProperties: false,
		},
	},
}

export { select_active_intent }

import type OpenAI from "openai"

const get_curated_context: OpenAI.Chat.ChatCompletionTool = {
	type: "function",
	function: {
		name: "get_curated_context",
		description: `Retrieve selective, curated context for a specific intent from the project's orchestration layer (intent_map, technical_context, shared_brain). Use this to get relevant information without overloading the context window.`,
		strict: true,
		parameters: {
			type: "object",
			properties: {
				intent_id: {
					type: "string",
					description: "The ID of the intent to retrieve context for.",
				},
				token_budget: {
					type: "string",
					description: "Optional token budget (approximate) for the context block. Default is 2000.",
				},
			},
			required: ["intent_id"],
			additionalProperties: false,
		},
	},
}

export { get_curated_context }

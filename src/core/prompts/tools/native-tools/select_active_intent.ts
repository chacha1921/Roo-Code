import { ToolDefinition } from "@roo-code/types"

export const select_active_intent: ToolDefinition = {
	name: "select_active_intent",
	description: `Select an active intent from the project's .orchestration/active_intents.yaml. This MUST be called before writing any code or executing destructive commands.`,
	input_schema: {
		type: "object",
		properties: {
			intent_id: {
				type: "string",
				description: "The ID of the intent to activate (e.g., 'INT-001')",
			},
		},
		required: ["intent_id"],
	},
}

import type { Context } from "@/tools/types";
import type { Prompt } from "./index";

export async function setupEventsPrompt(context: Context): Promise<Prompt> {
	return {
		name: "event-setup",
		title: "Setup PostHog Event Tracking",
		description: "Automatically instrument your project with PostHog event tracking",
		handler: async (_context, _args) => {
			return {
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: `Setup automatic PostHog event tracking in this project.

Use these MCP resources:
- posthog://event-setup/begin - The event setup workflow guide (start here)

Follow the workflow guide to implement event tracking. Everything is already configured for PostHog: focus entirely on adding events.`,
						},
					},
					{
						role: "assistant",
						content: {
							type: "text",
							text: "I'll set up PostHog event tracking in your project using the provided workflow guide and documentation.",
						},
					},
				],
			};
		},
	};
}

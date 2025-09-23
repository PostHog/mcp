import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Context } from "@/tools/types";
import { unzipSync, strFromU8 } from "fflate";

// Import workflow markdown files
import workflowBegin from "../../../workflow-prompts/1.0-event-setup-begin.md";
import workflowEdit from "../../../workflow-prompts/1.1-event-setup-edit.md";
import workflowRevise from "../../../workflow-prompts/1.2-event-setup-revise.md";

// Define workflow resources with their URIs and content
const workflowResources = [
	{
		uri: "posthog://event-setup/begin",
		name: "Event Setup - Begin",
		description: "Start the event tracking setup process",
		content: workflowBegin,
	},
	{
		uri: "posthog://event-setup/edit",
		name: "Event Setup - Edit",
		description: "Edit files to add PostHog event tracking",
		content: workflowEdit,
	},
	{
		uri: "posthog://event-setup/revise",
		name: "Event Setup - Revise",
		description: "Review and fix any errors in the implementation",
		content: workflowRevise,
	},
];

function getLanguageFromExtension(extension: string): string {
	const languageMap: Record<string, string> = {
		ts: "typescript",
		tsx: "typescript",
		js: "javascript",
		jsx: "javascript",
		json: "json",
		md: "markdown",
		css: "css",
		scss: "scss",
		html: "html",
		yml: "yaml",
		yaml: "yaml",
		toml: "toml",
		xml: "xml",
		sh: "bash",
		bash: "bash",
		sql: "sql",
		py: "python",
		go: "go",
		rs: "rust",
		java: "java",
		c: "c",
		cpp: "cpp",
		h: "c",
		hpp: "cpp",
	};
	return languageMap[extension.toLowerCase()] || extension;
}

export function registerResources(server: McpServer, _context: Context) {
	// Register all workflow resources
	for (const workflow of workflowResources) {
		server.registerResource(
			workflow.name,
			workflow.uri,
			{
				mimeType: "text/markdown",
				description: workflow.description,
			},
			async (uri) => {
				return {
					contents: [
						{
							uri: uri.toString(),
							text: workflow.content,
						},
					],
				};
			},
		);
	}

	// Register the PostHog docs resource - fetch from URL
	server.registerResource(
		"Integration docs",
		"posthog://docs",
		{
			mimeType: "text/markdown",
			description: "PostHog Next.js integration documentation",
		},
		async (uri) => {
			const response = await fetch("https://posthog.com/docs/libraries/next-js.md");
			const content = await response.text();
			return {
				contents: [
					{
						uri: uri.toString(),
						text: content,
					},
				],
			};
		},
	);

	// Register the identify users documentation resource
	server.registerResource(
		"Identify Users docs",
		"posthog://docs/identify",
		{
			mimeType: "text/markdown",
			description: "PostHog documentation on identifying users",
		},
		async (uri) => {
			const response = await fetch(
				"https://posthog.com/docs/getting-started/identify-users.md",
			);
			const content = await response.text();
			return {
				contents: [
					{
						uri: uri.toString(),
						text: content,
					},
				],
			};
		},
	);

	// Register example project resource
	server.registerResource(
		"Example project",
		"posthog://example-project",
		{
			mimeType: "text/markdown",
			description: "PostHog Next.js App Router example project files",
		},
		async (uri) => {
			try {
				// Fetch the ZIP archive from GitHub
				const zipUrl =
					"https://github.com/daniloc/posthog-app-router-example/archive/refs/heads/main.zip";
				const response = await fetch(zipUrl);

				if (!response.ok) {
					throw new Error(`Failed to fetch repository: ${response.statusText}`);
				}

				const arrayBuffer = await response.arrayBuffer();
				const uint8Array = new Uint8Array(arrayBuffer);

				// Extract the ZIP contents
				const unzipped = unzipSync(uint8Array);

				// Build markdown document with all files
				let markdown = "# PostHog Next.js App Router Example Project\n\n";
				markdown += "Repository: https://github.com/daniloc/posthog-app-router-example\n\n";
				markdown += "---\n\n";

				// Sort files for consistent output
				const sortedPaths = Object.keys(unzipped).sort();

				for (const filePath of sortedPaths) {
					// Skip directories and non-text files
					if (filePath.endsWith("/")) continue;

					// Skip binary files and unwanted files
					const skip = [
						".json",
						".yaml",
						".png",
						".jpg",
						".jpeg",
						".gif",
						".ico",
						".svg",
						".woff",
						".woff2",
						".ttf",
						".eot",
						".pdf",
						".zip",
						".tar",
						".gz",
						".exe",
						".dll",
						".so",
						".dylib",
						".DS_Store",
						"node_modules/",
						".git/",
						".next/",
					];
					if (skip.some((ext) => filePath.includes(ext))) continue;

					// Remove the repo folder prefix (e.g., "posthog-app-router-example-main/")
					const cleanPath = filePath.replace(/^[^/]+\//, "");

					try {
						const fileData = unzipped[filePath];
						if (!fileData) continue;

						const content = strFromU8(fileData);
						const extension = filePath.split(".").pop() || "";
						const language = getLanguageFromExtension(extension);

						markdown += `## ${cleanPath}\n\n`;
						markdown += `\`\`\`${language}\n`;
						markdown += content;
						markdown += "\n```\n\n";
					} catch (e) {
						// Skip files that can't be decoded as text
					}
				}

				return {
					contents: [
						{
							uri: uri.toString(),
							text: markdown,
						},
					],
				};
			} catch (error) {
				return {
					contents: [
						{
							uri: uri.toString(),
							text: `Error loading example project: ${error}\n\nPlease check your network connection and try again.`,
						},
					],
				};
			}
		},
	);
}

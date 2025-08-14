import { McpServer, type ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import type { z } from "zod";

import { ApiClient } from "@/api/client";
import { getPostHogClient } from "@/lib/client";
import { DurableObjectCache } from "@/lib/utils/cache/DurableObjectCache";
import { handleToolError } from "@/lib/utils/handleToolError";
import { hash } from "@/lib/utils/helper-functions";
import tools from "@/tools";
import type { Context, State } from "@/tools/types";

const INSTRUCTIONS = `
- You are a helpful assistant that can query PostHog API.
- If some resource from another tool is not found, ask the user if they want to try finding it in another project.
- If you cannot answer the user's PostHog related request or question using other available tools in this MCP, use the 'docs-search' tool to provide information from the documentation to guide user how they can do it themselves - when doing so provide condensed instructions with links to sources.
`;

type RequestProperties = {
	userHash: string;
	apiToken: string;
};

// Define our MCP agent with tools
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "PostHog MCP",
		version: "1.0.0",
		instructions: INSTRUCTIONS,
	});

	initialState: State = {
		projectId: undefined,
		orgId: undefined,
		distinctId: undefined,
	};

	_cache: DurableObjectCache<State> | undefined;

	get requestProperties() {
		return this.props as RequestProperties;
	}

	get cache() {
		if (!this.requestProperties.userHash) {
			throw new Error("User hash is required to use the cache");
		}

		if (!this._cache) {
			this._cache = new DurableObjectCache<State>(
				this.requestProperties.userHash,
				this.ctx.storage,
			);
		}

		return this._cache;
	}

	get api() {
		return new ApiClient({
			apiToken: this.requestProperties.apiToken,
		});
	}

	async getDistinctId() {
		let _distinctId = await this.cache.get("distinctId");

		if (!_distinctId) {
			const userResult = await this.api.users().me();
			if (!userResult.success) {
				throw new Error(`Failed to get user: ${userResult.error.message}`);
			}
			await this.cache.set("distinctId", userResult.data.distinctId);
			_distinctId = userResult.data.distinctId;
		}

		return _distinctId;
	}

	async trackEvent(event: string, properties: Record<string, any> = {}) {
		try {
			const distinctId = await this.getDistinctId();

			const client = getPostHogClient();

			client.capture({ distinctId, event, properties });
		} catch (error) {
			//
		}
	}

	registerTool<TSchema extends z.ZodRawShape>(
		name: string,
		description: string,
		schema: TSchema,
		handler: (params: z.infer<z.ZodObject<TSchema>>) => Promise<any>,
	): void {
		const wrappedHandler = async (params: z.infer<z.ZodObject<TSchema>>) => {
			await this.trackEvent("mcp tool call", {
				tool: name,
			});

			try {
				return await handler(params);
			} catch (error: any) {
				const distinctId = await this.getDistinctId();
				return handleToolError(error, name, distinctId);
			}
		};

		this.server.tool(
			name,
			description,
			schema,
			wrappedHandler as unknown as ToolCallback<TSchema>,
		);
	}

	async getOrgID(): Promise<string> {
		const orgId = await this.cache.get("orgId");

		if (!orgId) {
			const orgsResult = await this.api.organizations().list();
			if (!orgsResult.success) {
				throw new Error(`Failed to get organizations: ${orgsResult.error.message}`);
			}

			// If there is only one org, set it as the active org
			if (orgsResult.data.length === 1) {
				await this.cache.set("orgId", orgsResult.data[0]!.id.toString());
				return orgsResult.data[0]!.id.toString();
			}

			const currentOrg = await this.api.organizations().get({ orgId: "@current" });

			if (!currentOrg.success) {
				throw new Error(`Failed to get current organization: ${currentOrg.error.message}`);
			}

			await this.cache.set("orgId", currentOrg.data.id.toString());
			return currentOrg.data.id.toString();
		}

		return orgId;
	}

	async getProjectId(): Promise<string> {
		const projectId = await this.cache.get("projectId");

		if (!projectId) {
			const orgId = await this.getOrgID();
			const projectsResult = await this.api.organizations().projects({ orgId }).list();
			if (!projectsResult.success) {
				throw new Error(`Failed to get projects: ${projectsResult.error.message}`);
			}

			// If there is only one project, set it as the active project
			if (projectsResult.data.length === 1) {
				await this.cache.set("projectId", projectsResult.data[0]!.id.toString());
				return projectsResult.data[0]!.id.toString();
			}

			const currentProject = await this.api.projects().get({ projectId: "@current" });

			if (!currentProject.success) {
				throw new Error(`Failed to get current project: ${currentProject.error.message}`);
			}

			await this.cache.set("projectId", currentProject.data.id.toString());
			return currentProject.data.id.toString();
		}

		return projectId;
	}

	getContext(): Context {
		return {
			api: this.api,
			cache: this.cache,
			env: this.env,
			getProjectId: this.getProjectId.bind(this),
			getOrgID: this.getOrgID.bind(this),
			getDistinctId: this.getDistinctId.bind(this),
		};
	}

	async init() {
		const context = this.getContext();
		const allTools = tools(context);

		for (const tool of allTools) {
			this.registerTool(tool.name, tool.description, tool.schema.shape, async (params) =>
				tool.handler(context, params),
			);
		}
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);
		const token = request.headers.get("Authorization")?.split(" ")[1];

		if (!token) {
			return new Response("No token provided, please provide a valid API token.", {
				status: 401,
			});
		}

		if (!token.startsWith("phx_")) {
			return new Response("Invalid token, please provide a valid API token.", {
				status: 401,
			});
		}

		ctx.props = {
			apiToken: token,
			userHash: hash(token),
		};

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};

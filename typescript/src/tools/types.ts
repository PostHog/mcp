import type { z } from "zod";
import type { ApiClient } from "@/api/client";
import type { ScopedCache } from "@/lib/utils/cache/ScopedCache";

export type State = {
	projectId: string | undefined;
	orgId: string | undefined;
	distinctId: string | undefined;
};

export type Context = {
	api: ApiClient;
	cache: ScopedCache<State>;
	env: Env;
	getProjectId: () => Promise<string>;
	getOrgID: () => Promise<string>;
	getDistinctId: () => Promise<string>;
};

export type Tool<TSchema extends z.ZodTypeAny = z.ZodTypeAny> = {
	name: string;
	description: string;
	schema: TSchema;
	handler: (context: Context, params: z.infer<TSchema>) => Promise<any>;
};

export type ZodObjectAny = z.ZodObject<any, any, any, any, any>;

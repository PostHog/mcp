import type { ApiClient } from "@/api/client";
import type { State } from "@/tools/types";
import type { ScopedCache } from "./cache/ScopedCache";

export class StateManager {
	private _cache: ScopedCache<State>;
	private _api: ApiClient;

	constructor(cache: ScopedCache<State>, api: ApiClient) {
		this._cache = cache;
		this._api = api;
	}

	async getProjectId(): Promise<string> {
		const projectId = await this._cache.get("projectId");

		if (!projectId) {
			const orgId = await this.getOrgID();
			const projectsResult = await this._api.organizations().projects({ orgId }).list();
			if (!projectsResult.success) {
				throw new Error(`Failed to get projects: ${projectsResult.error.message}`);
			}

			// If there is only one project, set it as the active project
			if (projectsResult.data.length === 1) {
				await this._cache.set("projectId", projectsResult.data[0]!.id.toString());
				return projectsResult.data[0]!.id.toString();
			}

			const currentProject = await this._api.projects().get({ projectId: "@current" });

			if (!currentProject.success) {
				throw new Error(`Failed to get current project: ${currentProject.error.message}`);
			}

			await this._cache.set("projectId", currentProject.data.id.toString());
			return currentProject.data.id.toString();
		}

		return projectId;
	}

	async getDistinctId() {
		let _distinctId = await this._cache.get("distinctId");

		if (!_distinctId) {
			const userResult = await this._api.users().me();
			if (!userResult.success) {
				throw new Error(`Failed to get user: ${userResult.error.message}`);
			}
			await this._cache.set("distinctId", userResult.data.distinctId);
			_distinctId = userResult.data.distinctId;
		}

		return _distinctId;
	}

	async getOrgID(): Promise<string> {
		const orgId = await this._cache.get("orgId");

		if (!orgId) {
			const orgsResult = await this._api.organizations().list();
			if (!orgsResult.success) {
				throw new Error(`Failed to get organizations: ${orgsResult.error.message}`);
			}

			// If there is only one org, set it as the active org
			if (orgsResult.data.length === 1) {
				await this._cache.set("orgId", orgsResult.data[0]!.id.toString());
				return orgsResult.data[0]!.id.toString();
			}

			const currentOrg = await this._api.organizations().get({ orgId: "@current" });

			if (!currentOrg.success) {
				throw new Error(`Failed to get current organization: ${currentOrg.error.message}`);
			}

			await this._cache.set("orgId", currentOrg.data.id.toString());
			return currentOrg.data.id.toString();
		}

		return orgId;
	}
}

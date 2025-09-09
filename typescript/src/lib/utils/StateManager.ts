import type { ApiClient } from "@/api/client";
import type { ApiPersonalApiKey, ApiUser } from "@/schema/api";
import type { State } from "@/tools/types";
import type { ScopedCache } from "./cache/ScopedCache";

export class StateManager {
	private _cache: ScopedCache<State>;
	private _api: ApiClient;
	private _user?: ApiUser;
	private _apiKey?: ApiPersonalApiKey;

	constructor(cache: ScopedCache<State>, api: ApiClient) {
		this._cache = cache;
		this._api = api;
	}

	private async _fetchUser() {
		const userResult = await this._api.users().me();
		if (!userResult.success) {
			throw new Error(`Failed to get user: ${userResult.error.message}`);
		}
		return userResult.data;
	}

	async getUser() {
		if (!this._user) {
			this._user = await this._fetchUser();
		}

		return this._user;
	}

	private async _fetchApiKey() {
		const apiKeyResult = await this._api.apiKeys().current();
		if (!apiKeyResult.success) {
			throw new Error(`Failed to get API key: ${apiKeyResult.error.message}`);
		}
		return apiKeyResult.data;
	}

	private async _getApiKey() {
		if (!this._apiKey) {
			this._apiKey = await this._fetchApiKey();
		}
		return this._apiKey;
	}

	async getDistinctId() {
		let _distinctId = await this._cache.get("distinctId");

		if (!_distinctId) {
			const user = await this.getUser();

			await this._cache.set("distinctId", user.distinct_id);
			_distinctId = user.distinct_id;
		}

		return _distinctId;
	}

	private async _getOrganizationsWithAccess() {
		const { scoped_organizations, scoped_teams } = await this._getApiKey();
		const { organizations, organization: activeOrganization } = await this.getUser();

		const organizationsWithAccess = [];

		if (scoped_organizations.length > 0) {
			organizationsWithAccess.push(...scoped_organizations);
		}

		// Key is not scoped to any organizations or teams, so we return all organizations
		if (organizationsWithAccess.length === 0 && scoped_teams.length === 0) {
			organizationsWithAccess.push(...organizations.map((organization) => organization.id));
		}

		const activeOrganizationId = activeOrganization?.id;

		return organizationsWithAccess.sort((a, b) => {
			if (a === activeOrganizationId) return -1;
			if (b === activeOrganizationId) return 1;
			return 0;
		});
	}

	async getOrgID(): Promise<string> {
		const orgId = await this._cache.get("orgId");

		if (!orgId) {
			const organizationIds = await this._getOrganizationsWithAccess();

			if (organizationIds.length > 0) {
				await this._cache.set("orgId", organizationIds[0]!);
				return organizationIds[0]!;
			}

			// Token does not have access to any organizations, select one from a project
			const { scoped_teams } = await this._getApiKey();

			if (scoped_teams.length === 0) {
				throw new Error("API key does not have access to any organizations or teams");
			}

			const projectsResult = await this._api
				.projects()
				.get({ projectId: String(scoped_teams[0]!) });

			if (!projectsResult.success) {
				throw new Error("Failed to access any projects with API key");
			}

			console.log("projectsResult", projectsResult.data);

			await this._cache.set("orgId", projectsResult.data.organization);

			return projectsResult.data.organization;
		}

		return orgId;
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
}

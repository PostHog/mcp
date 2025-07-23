import { describe, it, expect } from "vitest";
import { ApiClient } from "@/api/client";
import { BASE_URL } from "@/lib/constants";

describe("ApiClient", () => {
	it("should create ApiClient with required config", () => {
		const client = new ApiClient({
			apiToken: "test-token",
		});

		expect(client).toBeInstanceOf(ApiClient);
	});

	it("should use default BASE_URL when not provided", () => {
		const client = new ApiClient({
			apiToken: "test-token",
		});

		// Access private property through type assertion for testing
		const baseUrl = (client as any).baseUrl;
		expect(baseUrl).toBe(BASE_URL);
	});

	it("should use custom baseUrl when provided", () => {
		const customUrl = "https://custom.example.com";
		const client = new ApiClient({
			apiToken: "test-token",
			baseUrl: customUrl,
		});

		const baseUrl = (client as any).baseUrl;
		expect(baseUrl).toBe(customUrl);
	});

	it("should build correct headers", () => {
		const client = new ApiClient({
			apiToken: "test-token-123",
		});

		const headers = (client as any).buildHeaders();
		expect(headers).toEqual({
			Authorization: "Bearer test-token-123",
			"Content-Type": "application/json",
		});
	});
});

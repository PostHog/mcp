import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		testTimeout: 30000,
		setupFiles: ["typescript/tests/setup.ts"],
		include: ["typescript/tests/**/*.test.ts"],
		exclude: ["node_modules/**", "dist/**", "typescript/tests/**/*.integration.test.ts"],
	},
	resolve: {
		alias: {
			"@": "/typescript/src",
		},
	},
});

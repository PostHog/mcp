import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		testTimeout: 60000,
		setupFiles: ["typescript/tests/setup.ts"],
		include: ["typescript/tests/**/*.integration.test.ts"],
		exclude: ["node_modules/**", "dist/**"],
	},
	resolve: {
		alias: {
			"@": "/typescript/src",
		},
	},
});

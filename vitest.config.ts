import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		testTimeout: 30000,
		setupFiles: ["tests/setup.ts"],
		include: ["tests/**/*.test.ts"],
		exclude: ["node_modules/**", "dist/**"],
	},
	resolve: {
		alias: {
			"@": "/src",
		},
	},
});

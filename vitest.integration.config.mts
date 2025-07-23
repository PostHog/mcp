import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [tsconfigPaths({ root: "./typescript" })],
	test: {
		globals: true,
		environment: "node",
		testTimeout: 30000,
		setupFiles: ["typescript/tests/setup.ts"],
		include: ["typescript/tests/**/*.integration.test.ts"],
		exclude: ["node_modules/**", "dist/**"],
	},
});

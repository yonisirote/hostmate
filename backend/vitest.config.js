import { defineConfig } from "vitest/config";
export default defineConfig({
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
        setupFiles: ["src/__tests__/vitest.setup.ts"],
        globals: true,
        clearMocks: true,
        restoreMocks: true,
        mockReset: true,
    },
});
//# sourceMappingURL=vitest.config.js.map
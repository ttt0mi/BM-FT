import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        globals: true, // to use describe/it/expect without imports
        environment: "node",
        coverage: {
            reporter: ["text", "html"],
            exclude: ["node_modules/", "dist/", "prisma/"],
        },
    },
});

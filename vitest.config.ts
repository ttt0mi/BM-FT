import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true, // to use describe/it/expect without imports
        environment: 'node',
        typecheck: {
            tsconfig: './tsconfig.test.json',
        },
        coverage: {
            reporter: ['text', 'html'],
            exclude: ['node_modules/', 'dist/', 'prisma/'],
        },
    },
});

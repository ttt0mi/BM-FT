import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
    {
        ignores: [
            'node_modules/',
            'dist/',
            'build/',
            'prisma.config.ts',
            'vitest.config.ts', 
            'src/generated/prisma/',
        ],
    },

    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,

    {
        files: ['**/*.ts'],

        languageOptions: {
            parserOptions: {
                projectService: {
                    allowDefaultProject: ['prisma/seed.ts'],
                },
                tsconfigRootDir: import.meta.dirname,
            },
        },

        rules: {
            'no-console': [
                'warn',
                {
                    allow: ['warn', 'error', 'info'],
                },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/consistent-type-imports': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/require-await': 'off',
        },
    },

    prettierRecommended,
]);

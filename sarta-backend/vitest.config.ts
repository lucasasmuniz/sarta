import path from 'node:path';
import { defineConfig } from 'vitest/config'

export default defineConfig({
    // setupFiles see it latter to mock stuff previously to the tests
    test: {
        globals: true,
        reporters: ['tree'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'clover', 'json', 'lcov'],
            // thresholds: {
            //     lines: 80,
            //     functions: 80,
            //     branches: 85,
            //     statements: 80,
            // }
        },
    },
    resolve: {
        alias: {
            "@shared": path.resolve(__dirname, "./src/shared"),
			"@modules": path.resolve(__dirname, "./src/modules"),
			"@database": path.resolve(__dirname, "./src/database")
        }
    },
});
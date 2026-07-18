import { buildApp } from "./app.js";

/**
 * this is the entry point. it starts the HTTP server.
 */
async function startApp(): Promise<void> {
    const app = await buildApp();

    const port = app.config.PORT || 3000;
    const host = app.config.HOST ?? "0.0.0.0";

    try {
        await app.listen({ port, host });
        console.info(`Server running at http://${host}:${port}`);
        console.info(`Health check: http://${host}:${port}/health`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}

process.on("SIGTERM", () => {
    console.info("SIGTERM received, shutting down...");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.info("SIGINT received, shutting down...");
    process.exit(0);
});

void startApp();

import { buildApp } from './app.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  try {
    const app = await buildApp();

    await app.listen({ port: PORT, host: HOST });

    console.log(`
🚀 Server ready at: http://localhost:${PORT}
📚 API Documentation:
   - Health: http://localhost:${PORT}/api/health
   - Tasks: http://localhost:${PORT}/api/tasks
    `);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

import { createLobbyServer } from './app.js';

const port = Number(process.env.PORT ?? 2567);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto válido.');
const { server } = createLobbyServer();
await server.listen(port, '127.0.0.1');
console.log(`Sala de selección: http://127.0.0.1:${port}`);
let shuttingDown = false;
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => {
  if (!shuttingDown) {
    shuttingDown = true;
    void server.gracefullyShutdown(false).then(() => process.exit(0));
  }
});

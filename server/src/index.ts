import { createApp } from './app.js';

const app = createApp();
const port = Number(process.env.PORT ?? 3001);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}

app.listen(port, (error) => {
  if (error) {
    if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      console.error(`Unable to start API: port ${port} is already in use (EADDRINUSE).`);
    } else {
      console.error(`Unable to start API on port ${port}:`, error);
    }
    process.exitCode = 1;
    return;
  }
  console.log(`API listening on http://localhost:${port}`);
});

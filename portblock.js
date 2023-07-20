import { Server } from "net";

const DEFAULT_PORT = 8545;
let server;

function startServer() {
  server = new Server();

  server.on("listening", () => {
    const now = new Date();
    const timestamp = now.toISOString();
    console.log(`Port ${DEFAULT_PORT} is in use: ${timestamp}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const now = new Date();
      const timestamp = now.toISOString();
      console.log(`Port ${DEFAULT_PORT} is not available: ${timestamp}`);
    } else {
      throw err;
    }
  });

  server.listen(DEFAULT_PORT);
}

process.on("SIGINT", () => {
  console.log("Received SIGINT. Closing server...");
  server.close(() => {
    console.log("Server closed. Exiting...");
    process.exit(0);
  });
});

startServer();

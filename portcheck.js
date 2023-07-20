import { exec } from "child_process";

function checkPort() {
  const now = new Date();
  const timestamp = now.toISOString();
  exec("lsof -i tcp:8545", (error, stdout, stderr) => {
    if (stdout.includes("LISTEN")) {
      console.log(`Port 8545 is in use: ${timestamp}`);
      if (error) {
        console.log(`Error: ${error.message}`);
        return;
      }

      if (stderr) {
        console.log(`Stderr: ${stderr}`);
        return;
      }

      console.log(`\n${stdout}`);
    } else {
      console.log(`Port 8545 is available: ${timestamp}`);
    }
  });
}

function main() {
  checkPort();
  setInterval(checkPort, 500); // check every half second
}

process.on("SIGINT", () => {
  console.log("Received SIGINT. Exiting...");
  process.exit(0);
});

main();

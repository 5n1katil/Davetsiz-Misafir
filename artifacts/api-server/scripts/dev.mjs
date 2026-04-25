import { spawn } from "node:child_process";

const env = {
  ...process.env,
  NODE_ENV: "development",
};

const run = (command, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("exit", (code) => {
      if (code === 0) return resolve();
      reject(new Error(`${command} ${args.join(" ")} failed with code ${code}`));
    });
  });

try {
  await run("corepack", ["pnpm", "run", "build"]);
  await run("corepack", ["pnpm", "run", "start"]);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

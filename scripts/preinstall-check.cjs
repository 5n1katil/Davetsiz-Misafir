const fs = require("node:fs");
const path = require("node:path");

for (const lockFile of ["package-lock.json", "yarn.lock"]) {
  const lockPath = path.resolve(process.cwd(), lockFile);
  if (fs.existsSync(lockPath)) {
    fs.rmSync(lockPath, { force: true });
  }
}

const ua = process.env.npm_config_user_agent ?? "";
if (!ua.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}

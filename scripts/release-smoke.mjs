#!/usr/bin/env node

function parseArg(name) {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function normalizeUrl(value, label) {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/+$/, "");
  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid ${label} URL: ${value}`);
  }
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    return { response, text };
  } finally {
    clearTimeout(timer);
  }
}

function logPass(label, detail) {
  console.log(`PASS ${label}: ${detail}`);
}

function logFail(label, detail) {
  console.error(`FAIL ${label}: ${detail}`);
}

async function checkApiHealth(apiUrl) {
  const url = `${apiUrl}/health`;
  const { response, text } = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  try {
    const parsed = JSON.parse(text);
    const status = String(parsed.status || "").toLowerCase();
    if (status !== "ok") {
      throw new Error(`Unexpected health payload: ${text}`);
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Health endpoint did not return JSON: ${text.slice(0, 200)}`);
    }
    throw error;
  }
}

async function checkWebRoot(webUrl) {
  const { response, text } = await fetchWithTimeout(webUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${webUrl}`);
  }
  const lower = text.toLowerCase();
  if (!lower.includes("<html") && !lower.includes("<!doctype html")) {
    throw new Error("Response does not look like an HTML document");
  }
}

async function checkSocketPolling(socketUrl) {
  const paths = ["/socket.io", "/api/socket.io"];
  const failures = [];
  for (const basePath of paths) {
    const url = `${socketUrl}${basePath}/?EIO=4&transport=polling`;
    try {
      const { response, text } = await fetchWithTimeout(url);
      if (!response.ok) {
        failures.push(`HTTP ${response.status} from ${url}`);
        continue;
      }
      if (!text.startsWith("0{")) {
        failures.push(`Unexpected payload from ${url}: ${text.slice(0, 120)}`);
        continue;
      }
      return `${socketUrl}${basePath}`;
    } catch (error) {
      failures.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(failures.join(" | "));
}

async function main() {
  const apiUrl = normalizeUrl(
    parseArg("api") || process.env.SMOKE_API_URL || process.env.EXPO_PUBLIC_API_URL,
    "api",
  );
  const webUrl = normalizeUrl(
    parseArg("web") || process.env.SMOKE_WEB_URL || process.env.VERCEL_URL,
    "web",
  );
  const socketUrl = normalizeUrl(
    parseArg("socket") || process.env.SMOKE_SOCKET_URL || apiUrl || process.env.EXPO_PUBLIC_SOCKET_URL,
    "socket",
  );

  if (!apiUrl || !webUrl) {
    console.error("Usage: node scripts/release-smoke.mjs --api=https://api.example.com --web=https://app.example.com [--socket=https://api.example.com]");
    console.error("Or set env vars: SMOKE_API_URL, SMOKE_WEB_URL, SMOKE_SOCKET_URL");
    process.exit(2);
  }

  let failed = false;

  try {
    await checkApiHealth(apiUrl);
    logPass("api-health", `${apiUrl}/health`);
  } catch (error) {
    failed = true;
    logFail("api-health", error instanceof Error ? error.message : String(error));
  }

  try {
    await checkWebRoot(webUrl);
    logPass("web-root", webUrl);
  } catch (error) {
    failed = true;
    logFail("web-root", error instanceof Error ? error.message : String(error));
  }

  try {
    const matchedPath = await checkSocketPolling(socketUrl);
    logPass("socket-polling", matchedPath);
  } catch (error) {
    failed = true;
    logFail("socket-polling", error instanceof Error ? error.message : String(error));
  }

  if (failed) {
    process.exit(1);
  }
  console.log("Release smoke checks passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

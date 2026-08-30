import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const secretFile = resolve(".secrets/quote-signer.env");
const childEnv = { ...process.env };

if (existsSync(secretFile)) {
  for (const rawLine of readFileSync(secretFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) throw new Error("Invalid quote-signer environment entry.");
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!/^[A-Z][A-Z0-9_]*$/.test(key)) throw new Error("Invalid quote-signer environment key.");
    if (childEnv[key] === undefined) childEnv[key] = value;
  }
}

const nextBin = resolve("node_modules/next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  env: childEnv,
  stdio: "inherit",
});

child.on("error", error => {
  console.error(`Unable to start Next.js: ${error.message}`);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});

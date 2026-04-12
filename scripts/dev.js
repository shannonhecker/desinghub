/**
 * Dev server wrapper — ensures `node` is in PATH for Turbopack PostCSS workers.
 * Used by .claude/launch.json.
 */
const { spawn } = require("child_process");
const path = require("path");

const nodeBinDir = path.dirname(process.execPath);
process.env.PATH = nodeBinDir + ":" + (process.env.PATH || "");

const child = spawn(
  process.execPath,
  [path.join("node_modules", ".bin", "next"), "dev"],
  { stdio: "inherit", env: process.env }
);

child.on("exit", (code) => process.exit(code ?? 1));

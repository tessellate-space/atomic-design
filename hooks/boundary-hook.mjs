#!/usr/bin/env node
// Opt-in hook: after an edit under a library level, run the repo's boundary test.
// Exits 0 at once unless .atomic-design.json sets hook.enabled to true and the edited
// path matches a level. On a failing boundary command it exits 2 with the output, which
// Claude Code feeds back to the agent. Standard library only.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const MAP = ".atomic-design.json";

function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === "*" && glob[i + 1] === "*") {
      if (glob[i + 2] === "/") { out += "(?:.*/)?"; i += 2; } else { out += ".*"; i += 1; }
    } else if (c === "*") out += "[^/]*";
    else if (c === "?") out += "[^/]";
    else if (c === "{") out += "(?:";
    else if (c === "}") out += ")";
    else if (c === ",") out += glob.slice(0, i).lastIndexOf("{") > glob.slice(0, i).lastIndexOf("}") ? "|" : ",";
    else out += c.replace(/[.+^$()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${out}$`);
}

function findMap(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, MAP))) return dir;
    const up = dirname(dir);
    if (up === dir) return undefined;
    dir = up;
  }
}

let input = "";
for await (const chunk of process.stdin) input += chunk;
let event;
try { event = JSON.parse(input || "{}"); } catch { process.exit(0); }

const file = event?.tool_input?.file_path ?? event?.tool_response?.filePath;
if (typeof file !== "string") process.exit(0);

const root = findMap(dirname(resolve(event.cwd ?? process.cwd(), file)));
if (!root) process.exit(0);

let map;
try { map = JSON.parse(readFileSync(join(root, MAP), "utf8")); } catch { process.exit(0); }
if (map?.hook?.enabled !== true) process.exit(0);

const rel = relative(root, resolve(event.cwd ?? process.cwd(), file)).split(sep).join("/");
const globs = Object.values(map.levels ?? {}).flat();
if (!globs.some((g) => globToRegExp(g).test(rel))) process.exit(0);

const command = map?.tests?.boundary;
if (typeof command !== "string" || !command.trim()) process.exit(0);

const run = spawnSync(command, { cwd: root, shell: true, encoding: "utf8", timeout: 170_000 });
if (run.status === 0) process.exit(0);
process.stderr.write(`atomic-design boundary check failed after editing ${rel}:\n${run.stdout ?? ""}${run.stderr ?? ""}\n`);
process.exit(2);

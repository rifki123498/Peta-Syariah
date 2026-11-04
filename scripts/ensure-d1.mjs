// Ensures the D1 database exists in the Cloudflare account and writes its id into wrangler.toml
// (in the CI workspace only). Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const NAME = "peta-syariah";
const run = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

let id = null;
try {
  const list = JSON.parse(run("npx wrangler d1 list --json"));
  id = list.find((d) => d.name === NAME)?.uuid || null;
} catch (e) {
  console.error("Could not list D1 databases:", e.stderr || e.message);
  process.exit(1);
}

if (!id) {
  const out = run(`npx wrangler d1 create ${NAME}`);
  const m = out.match(/database_id\s*=\s*"([0-9a-f-]{36})"/) || out.match(/"database_id":\s*"([0-9a-f-]{36})"/);
  if (!m) { console.error("Created database but could not read its id:\n" + out); process.exit(1); }
  id = m[1];
  console.log("Created D1 database", NAME, id);
} else {
  console.log("Found D1 database", NAME, id);
}

const toml = readFileSync("wrangler.toml", "utf8").replace(/database_id = "[^"]*"/, `database_id = "${id}"`);
writeFileSync("wrangler.toml", toml);

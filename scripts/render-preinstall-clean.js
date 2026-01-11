/**
 * Render preinstall cleanup
 *
 * Fixes intermittent npm failures on Render like:
 * - ENOTEMPTY rename inside node_modules
 * - "Exit handler never called!"
 *
 * Strategy:
 * - Only run when explicitly enabled via env var (so local dev isn't impacted)
 * - Remove node_modules in the current working directory
 * - Remove npm cache dir if npm exposed it via env (npm_config_cache)
 */

const fs = require("fs");
const path = require("path");

function rmRF(targetPath) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    // eslint-disable-next-line no-console
    console.log(`[render-preinstall-clean] removed: ${targetPath}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(`[render-preinstall-clean] failed to remove ${targetPath}:`, err?.message || err);
  }
}

function main() {
  // Only run when explicitly enabled via env var (so local dev isn't impacted)
  const force = process.env.RENDER_FORCE_CLEAN_INSTALL === "1";
  if (!force) {
    // eslint-disable-next-line no-console
    console.log("[render-preinstall-clean] skipped (set RENDER_FORCE_CLEAN_INSTALL=1 to enable)");
    return;
  }

  const cwd = process.cwd();
  const nodeModulesPath = path.join(cwd, "node_modules");
  
  // Only clean if node_modules exists (avoid cleaning during install if rm -rf already ran)
  if (!fs.existsSync(nodeModulesPath)) {
    // eslint-disable-next-line no-console
    console.log("[render-preinstall-clean] skipped (node_modules does not exist)");
    return;
  }
  // eslint-disable-next-line no-console
  console.log(`[render-preinstall-clean] running in: ${cwd}`);

  rmRF(path.join(cwd, "node_modules"));

  const npmCache = process.env.npm_config_cache;
  if (npmCache && typeof npmCache === "string") {
    rmRF(npmCache);
  }
}

main();


import { cp, mkdir, access } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();

const sourceWasmDir = path.join(
  projectRoot,
  "node_modules",
  "@mediapipe",
  "tasks-vision",
  "wasm",
);

const targetWasmDir = path.join(projectRoot, "public", "mediapipe", "wasm");

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(sourceWasmDir))) {
    throw new Error(`MediaPipe WASM source not found: ${sourceWasmDir}`);
  }

  await ensureDir(targetWasmDir);

  await cp(sourceWasmDir, targetWasmDir, {
    recursive: true,
    force: true,
  });

  console.log(`Copied MediaPipe WASM assets -> ${path.relative(projectRoot, targetWasmDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

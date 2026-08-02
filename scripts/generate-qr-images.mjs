import { execFile } from "node:child_process"
import { mkdir, readFile, rm } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const useLocal = process.argv.includes("--local")
const useMobile = process.argv.includes("--mobile")

if (useLocal && useMobile) {
  throw new Error("Use apenas um dos flags: --local ou --mobile")
}

const scriptPath = path.resolve("scripts/generate-event-qr-images-png.mjs")
const qrDirectory = path.resolve("artifacts/qr")

async function loadEnvFile(filename, override = false) {
  const content = await readFile(path.resolve(filename), "utf8")

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || line.startsWith("#")) {
      continue
    }

    const [key, ...rest] = line.split("=")
    if (!key) {
      continue
    }

    const value = rest.join("=")
    if (value === undefined) {
      continue
    }

    if (override || process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

async function cleanQrDirectory() {
  await rm(qrDirectory, { recursive: true, force: true })
  await mkdir(qrDirectory, { recursive: true })
}

async function main() {
  await cleanQrDirectory()

  await loadEnvFile(".env")

  if (useLocal) {
    await loadEnvFile(".env.local", true)
  } else if (useMobile) {
    await loadEnvFile(".env.mobile", true)
  }

  const { stdout, stderr } = await execFileAsync("node", [scriptPath], {
    stdio: ["inherit", "pipe", "pipe"],
    env: process.env,
  })

  if (stdout) {
    process.stdout.write(stdout)
  }

  if (stderr) {
    process.stderr.write(stderr)
  }
}

main().catch((error) => {
  process.stderr.write(String(error) + "\n")
  process.exit(1)
})

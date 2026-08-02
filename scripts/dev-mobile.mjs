import { spawn } from "node:child_process"

const PORT = process.env.PORT ?? "3000"

const rawNgrokDomain = process.env.NGROK_DOMAIN

if (!rawNgrokDomain) {
  throw new Error(
    "NGROK_DOMAIN não foi definida. Configure-a no arquivo .env.mobile."
  )
}

const NGROK_DOMAIN = rawNgrokDomain
  .trim()
  .replace(/^https?:\/\//, "")
  .replace(/\/+$/, "")

const NGROK_PUBLIC_URL = `https://${NGROK_DOMAIN}`
const NGROK_API_URL = "http://127.0.0.1:4040/api/tunnels"

let ngrokProcess
let nextProcess
let shuttingDown = false

/**
 * Aguarda um intervalo em milissegundos.
 *
 * @param {number} milliseconds
 */
function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

/**
 * Inicia um processo filho exibindo seus logs no terminal atual.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {string} name
 * @param {NodeJS.ProcessEnv} [environment]
 */
function startProcess(
  command,
  args,
  name,
  environment = process.env
) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: environment,
    stdio: "inherit",
    shell: false,
  })

  child.on("error", (error) => {
    console.error(`\n[${name}] Não foi possível iniciar o processo:`)
    console.error(error)
    shutdown(1)
  })

  return child
}

/**
 * Encerra processos locais anteriores do ngrok.
 *
 * Atenção: isso encerra qualquer processo ngrok em execução no WSL,
 * mesmo que pertença a outro projeto.
 */
async function stopExistingNgrok() {
  console.log("[MOBILE] Verificando processos anteriores do ngrok...")

  await new Promise((resolve) => {
    const child = spawn("pkill", ["-f", "ngrok"], {
      stdio: "ignore",
      shell: false,
    })

    child.on("exit", resolve)
    child.on("error", resolve)
  })

  await sleep(1_000)
}

/**
 * Consulta a API local do ngrok até encontrar o túnel esperado.
 *
 * @param {number} attempts
 * @returns {Promise<string>}
 */
async function getNgrokPublicUrl(attempts = 30) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (ngrokProcess?.exitCode !== null) {
      throw new Error(
        `O ngrok foi encerrado antes de criar o túnel. Código: ${ngrokProcess.exitCode}`
      )
    }

    try {
      const response = await fetch(NGROK_API_URL)

      if (response.ok) {
        const data = await response.json()

        const tunnel = data.tunnels?.find(
          (item) => item.public_url === NGROK_PUBLIC_URL
        )

        if (tunnel?.public_url) {
          return tunnel.public_url
        }
      }
    } catch {
      // A API local ainda pode não estar disponível.
    }

    console.log(
      `[MOBILE] Aguardando túnel do ngrok... ${attempt}/${attempts}`
    )

    await sleep(1_000)
  }

  throw new Error(
    `Não foi possível encontrar o túnel ${NGROK_PUBLIC_URL}.`
  )
}

/**
 * Encerra os processos iniciados pelo script.
 *
 * @param {number} exitCode
 */
function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  console.log("\n[MOBILE] Encerrando ambiente mobile...")

  if (nextProcess && nextProcess.exitCode === null) {
    nextProcess.kill("SIGTERM")
  }

  if (ngrokProcess && ngrokProcess.exitCode === null) {
    ngrokProcess.kill("SIGTERM")
  }

  setTimeout(() => {
    process.exit(exitCode)
  }, 500)
}

/**
 * Inicia o ambiente mobile.
 */
async function main() {
  console.log("")
  console.log("[MOBILE] Configuração:")
  console.log(`- Porta local: ${PORT}`)
  console.log(`- URL pública: ${NGROK_PUBLIC_URL}`)
  console.log("")

  await stopExistingNgrok()

  console.log("[MOBILE] Iniciando ngrok...")

  ngrokProcess = startProcess(
    "ngrok",
    ["http", "--url", NGROK_DOMAIN, PORT],
    "NGROK"
  )

  ngrokProcess.on("exit", (code, signal) => {
    if (shuttingDown) {
      return
    }

    console.error(
      `[NGROK] Processo encerrado inesperadamente. Código: ${code}, sinal: ${signal}`
    )

    shutdown(code ?? 1)
  })

  const publicUrl = await getNgrokPublicUrl()

  /*
   * As variáveis são alteradas somente em memória.
   * O arquivo .env.local não será modificado.
   */
  const mobileEnvironment = {
    ...process.env,
    AUTH_URL: publicUrl,
    AUTH_TRUST_HOST: "true",
    NEXT_PUBLIC_APP_URL: publicUrl,
  }

  console.log("")
  console.log("[MOBILE] Túnel disponível.")
  console.log("")
  console.log("[MOBILE] Variáveis utilizadas pelo Next.js:")
  console.log(`AUTH_URL=${mobileEnvironment.AUTH_URL}`)
  console.log(
    `AUTH_TRUST_HOST=${mobileEnvironment.AUTH_TRUST_HOST}`
  )
  console.log(
    `NEXT_PUBLIC_APP_URL=${mobileEnvironment.NEXT_PUBLIC_APP_URL}`
  )
  console.log("")
  console.log("[MOBILE] Iniciando Next.js...")
  console.log("")

  nextProcess = startProcess(
    "pnpm",
    [
      "exec",
      "next",
      "dev",
      "--hostname",
      "0.0.0.0",
      "-p",
      PORT,
    ],
    "NEXT",
    mobileEnvironment
  )

  nextProcess.on("exit", (code, signal) => {
    if (shuttingDown) {
      return
    }

    console.log(
      `[NEXT] Processo encerrado. Código: ${code}, sinal: ${signal}`
    )

    shutdown(code ?? 0)
  })
}

process.on("SIGINT", () => shutdown(0))
process.on("SIGTERM", () => shutdown(0))

main().catch((error) => {
  console.error("")
  console.error("[MOBILE] Falha ao iniciar o ambiente:")

  if (error instanceof Error) {
    console.error(error.message)
  } else {
    console.error(error)
  }

  shutdown(1)
})

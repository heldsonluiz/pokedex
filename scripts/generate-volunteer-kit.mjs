/** Read-only database access; generates an isolated shareable kit. */
import { spawnSync } from "node:child_process"
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import QRCode from "qrcode"

import {
  isDevMode,
  loadLocalEnvironment,
  parseArguments,
} from "./lib/firestore-admin.mjs"

const args = parseArguments()
await loadLocalEnvironment(".env.local", { override: true })
if (!isDevMode()) throw new Error("O kit exige DEVMODE=true.")
const target = new URL(args.target ?? "https://pokedex.heldsonluiz.dev.br")
if (
  target.protocol !== "https:" ||
  target.pathname !== "/" ||
  target.search ||
  target.hash ||
  target.username ||
  target.password
)
  throw new Error("Informe somente a origem HTTPS pública.")
const output = path.resolve("artifacts/volunteer-tests")
const qrDirectory = path.join(output, "qr")
await mkdir(qrDirectory, { recursive: true })
const generated = spawnSync(
  process.execPath,
  ["scripts/generate-event-qr-images-png.mjs"],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_APP_URL: target.origin,
      QR_OUTPUT_DIRECTORY: qrDirectory,
    },
    stdio: "inherit",
  }
)
if (generated.status !== 0)
  throw new Error("Falha ao gerar imagens do catálogo.")
const items = JSON.parse(
  await readFile(path.join(qrDirectory, "qr-links.json"), "utf8")
)
if (items.length !== 37)
  throw new Error(
    `Esperados 37 QRs do catálogo de voluntários; recebidos ${items.length}. Confira o seed.`
  )
await QRCode.toFile(
  path.join(qrDirectory, "controle-externo.png"),
  "https://example.com/",
  { width: 800, margin: 4 }
)
items.push({
  id: "controle-externo",
  type: "control",
  name: "QR externo — deve ser recusado",
  filename: "controle-externo.png",
  url: "https://example.com/",
})
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
const sections = [
  ["company", "Empresas"],
  ["tag", "Tags"],
  ["mission", "Missões por QR"],
  ["control", "Controle de erro"],
]
  .map(
    ([type, title]) =>
      `<section><h2>${title}</h2><div class="grid">${items
        .filter((item) => item.type === type)
        .map(
          (item) =>
            `<article><h3>${escape(item.name)}</h3><img src="qr/${escape(item.filename)}" alt="QR Code de ${escape(item.name)}" loading="lazy"><p><a href="${escape(item.url)}">Abrir link (alternativa; não valida a câmera)</a></p></article>`
        )
        .join("")}</div></section>`
  )
  .join("")
await writeFile(
  path.join(output, "index.html"),
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QR Codes — teste da Pokédex</title><style>body{font:18px system-ui;max-width:1200px;margin:24px auto;padding:0 20px;color:#172033;background:white}a{color:#134bb3}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px}article{border:1px solid #aaa;border-radius:12px;padding:16px;break-inside:avoid}img{width:100%;height:auto}h3{font-size:20px}@media print{article{page-break-inside:avoid}a{display:none}.grid{display:block}article{width:75%;margin:0 auto;page-break-after:always}img{max-height:210mm;width:auto;max-width:100%}}</style><h1>Kit de QR Codes da Pokédex</h1><p>Ambiente: <a href="${target.origin}">${target.origin}</a>. Somente testes: prêmios e atividades fictícios.</p><p>Abra este arquivo em um computador ou outro celular e use o scanner da Pokédex para ler as imagens. Você também pode imprimir os PNGs ou usar Imprimir → Salvar como PDF neste navegador.</p><p>Comece pelo <a href="roteiro.html">roteiro de testes</a>. Missões por reviewer e automáticas não possuem QR público. Para conexões, use o QR atualizado do próprio colega.</p>${sections}</html>`
)
await copyFile(
  "docs/testing/roteiro-voluntarios.md",
  path.join(output, "roteiro-voluntarios.md")
)
await writeFile(
  path.join(output, "manifest.json"),
  JSON.stringify(
    {
      target: target.origin,
      eventId: process.env.EVENT_ID,
      generatedAt: new Date().toISOString(),
      items,
    },
    null,
    2
  ) + "\n"
)
console.log(JSON.stringify({ output, catalogQrCodes: 37, controlQrCodes: 1 }))

// Render the controlled Markdown guide without external services or dependencies.
const guide = await readFile("docs/testing/roteiro-voluntarios.md", "utf8")
const inline = (text) =>
  escape(text)
    .replace(/\[([^\]]+)\]\((https?:[^ )]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
const blocks = []
let inCode = false
let code = []
for (const block of guide.split(/\n\n/)) {
  if (inCode || block.startsWith("```")) {
    for (const line of block.split("\n")) {
      if (line.startsWith("```")) {
        if (inCode) {
          blocks.push(`<pre>${escape(code.join("\n"))}</pre>`)
          code = []
        }
        inCode = !inCode
      } else if (inCode) code.push(line)
    }
    continue
  }
  const heading = block.match(/^(#{1,3}) (.+)$/)
  if (heading) {
    const level = heading[1].length
    blocks.push(`<h${level}>${inline(heading[2])}</h${level}>`)
    continue
  }
  if (/^(?:\d+\. |[-] )/.test(block)) {
    const tag = /^\d/.test(block) ? "ol" : "ul"
    const entries = block.split(/\n(?=\d+\. |[-] )/)
    blocks.push(
      `<${tag}>${entries.map((entry) => `<li>${inline(entry.replace(/^(?:\d+\. |[-] )/, ""))}</li>`).join("")}</${tag}>`
    )
  } else blocks.push(`<p>${inline(block)}</p>`)
}
await writeFile(
  path.join(output, "roteiro.html"),
  `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Roteiro de testes da Pokédex</title><style>body{font:18px/1.6 system-ui;max-width:850px;margin:24px auto;padding:0 20px;color:#172033;background:#fff}h2{margin-top:2.5em}li{margin-bottom:.6em}a{color:#134bb3}pre{background:#eee;padding:16px;white-space:pre-wrap;overflow-wrap:anywhere}nav{padding:16px;background:#eee}</style><nav><a href="index.html">Abrir kit de QR Codes</a></nav>${blocks.join("\n")}</html>`
)

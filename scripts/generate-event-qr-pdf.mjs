/**
 * Gera um PDF A4 com os QR Codes públicos ativos de empresas, tags e missões
 * com validação por QR do EVENT_ID configurado.
 *
 * O comando apenas consulta o Firestore; ele não altera documentos. O arquivo
 * artifacts/event-qr-codes-a4.pdf é criado ou substituído, separado por
 * categoria: empresas usam grade 2x2; tags e missões usam grade 3x3.
 *
 * Para executar com as variáveis de .env.local:
 *   node --env-file=.env.local scripts/generate-event-qr-pdf.mjs
 *
 * Antes de distribuir o PDF, confira no resumo exibido pelo terminal a origem
 * formada por NEXT_PUBLIC_APP_URL, teste os códigos e imprima em escala de
 * 100%, sem o redimensionamento automático da impressora.
 */
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"

import { cert, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import QRCode from "qrcode"

import {
  EVENT_QR_PRINT_STYLE,
  hexToPdfRgb,
} from "./lib/event-qr-print-style.mjs"

const OUTPUT_DIRECTORY = path.resolve("artifacts")
const OUTPUT_FILE = path.join(OUTPUT_DIRECTORY, "event-qr-codes-a4.pdf")
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const PAGE_MARGIN = 6
const GRID_GAP = 6
const STYLE = EVENT_QR_PRINT_STYLE
const PDF_COLORS = Object.fromEntries(
  Object.entries(STYLE).map(([name, value]) => [name, hexToPdfRgb(value)])
)

function requireEnvironment(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

function ascii(value) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\x20-\x7e]/g, "")
}

function pdfText(value) {
  return ascii(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)")
}

function drawText(text, x, y, size, font = "F1", color = PDF_COLORS.text) {
  return `${color} rg BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfText(text)}) Tj ET\n`
}

function estimateTextWidth(text, size, font) {
  const averageCharacterWidth = font === "F2" ? 0.56 : 0.5
  return ascii(text).length * size * averageCharacterWidth
}

function drawCenteredText(
  text,
  centerX,
  y,
  size,
  font = "F1",
  color = PDF_COLORS.text
) {
  const x = centerX - estimateTextWidth(text, size, font) / 2
  return drawText(text, x, y, size, font, color)
}

function roundedRectanglePath(x, y, width, height, radius) {
  const kappa = 0.552_284_749_8
  const control = radius * kappa
  const right = x + width
  const top = y + height

  return [
    `${(x + radius).toFixed(2)} ${y.toFixed(2)} m`,
    `${(right - radius).toFixed(2)} ${y.toFixed(2)} l`,
    `${(right - radius + control).toFixed(2)} ${y.toFixed(2)} ${right.toFixed(2)} ${(y + radius - control).toFixed(2)} ${right.toFixed(2)} ${(y + radius).toFixed(2)} c`,
    `${right.toFixed(2)} ${(top - radius).toFixed(2)} l`,
    `${right.toFixed(2)} ${(top - radius + control).toFixed(2)} ${(right - radius + control).toFixed(2)} ${top.toFixed(2)} ${(right - radius).toFixed(2)} ${top.toFixed(2)} c`,
    `${(x + radius).toFixed(2)} ${top.toFixed(2)} l`,
    `${(x + radius - control).toFixed(2)} ${top.toFixed(2)} ${x.toFixed(2)} ${(top - radius + control).toFixed(2)} ${x.toFixed(2)} ${(top - radius).toFixed(2)} c`,
    `${x.toFixed(2)} ${(y + radius).toFixed(2)} l`,
    `${x.toFixed(2)} ${(y + radius - control).toFixed(2)} ${(x + radius - control).toFixed(2)} ${y.toFixed(2)} ${(x + radius).toFixed(2)} ${y.toFixed(2)} c`,
    "h",
  ].join(" ")
}

function drawFittedCenteredText(
  text,
  centerX,
  y,
  maxWidth,
  maxSize,
  minSize,
  font = "F1",
  color = PDF_COLORS.text
) {
  const estimatedWidth = estimateTextWidth(text, maxSize, font)
  const size = Math.max(
    minSize,
    Math.min(maxSize, maxSize * (maxWidth / estimatedWidth))
  )

  return drawCenteredText(text, centerX, y, size, font, color)
}

function drawQrCode(value, x, y, size) {
  const qr = QRCode.create(value, {
    errorCorrectionLevel: "M",
  })
  const moduleCount = qr.modules.size
  const quietZone = 4
  const totalModules = moduleCount + quietZone * 2
  const moduleSize = size / totalModules
  let output = `${PDF_COLORS.qr} rg\n`

  for (let row = 0; row < moduleCount; row += 1) {
    let startColumn = null

    for (let column = 0; column <= moduleCount; column += 1) {
      const isDark =
        column < moduleCount && Boolean(qr.modules.get(row, column))

      if (isDark && startColumn === null) {
        startColumn = column
      }

      if (!isDark && startColumn !== null) {
        const runLength = column - startColumn
        const rectangleX = x + (quietZone + startColumn) * moduleSize
        const rectangleY = y + size - (quietZone + row + 1) * moduleSize

        output += `${rectangleX.toFixed(3)} ${rectangleY.toFixed(3)} ${(runLength * moduleSize).toFixed(3)} ${moduleSize.toFixed(3)} re f\n`
        startColumn = null
      }
    }
  }

  return output
}

function buildPdf(pages) {
  const objects = []
  const addObject = (content) => {
    objects.push(Buffer.isBuffer(content) ? content : Buffer.from(content))
    return objects.length
  }

  const catalogId = addObject("")
  const pagesId = addObject("")
  const fontRegularId = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  )
  const fontBoldId = addObject(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  )
  const pageIds = []

  for (const pageContent of pages) {
    const contentBuffer = Buffer.from(pageContent, "latin1")
    const contentId = addObject(
      Buffer.concat([
        Buffer.from(`<< /Length ${contentBuffer.length} >>\nstream\n`),
        contentBuffer,
        Buffer.from("\nendstream"),
      ])
    )
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`
    )
    pageIds.push(pageId)
  }

  objects[catalogId - 1] = Buffer.from(
    `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  )
  objects[pagesId - 1] = Buffer.from(
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`
  )

  const chunks = [Buffer.from("%PDF-1.4\n%\xff\xff\xff\xff\n", "latin1")]
  const offsets = [0]
  let byteOffset = chunks[0].length

  objects.forEach((object, index) => {
    offsets.push(byteOffset)
    const chunk = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`),
      object,
      Buffer.from("\nendobj\n"),
    ])
    chunks.push(chunk)
    byteOffset += chunk.length
  })

  const xrefOffset = byteOffset
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`

  for (let index = 1; index <= objects.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`
  }

  chunks.push(
    Buffer.from(
      `${xref}trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
    )
  )

  return Buffer.concat(chunks)
}

function getGroupLayout(label) {
  return label === "Empresas"
    ? { columns: 2, rows: 2 }
    : { columns: 3, rows: 3 }
}

function getSingularLabel(label) {
  return {
    Empresas: "EMPRESA",
    Missoes: "MISSAO",
    Tags: "TAG",
  }[ascii(label)]
}

function drawGridSeparators(columns, rows, cellWidth, cellHeight) {
  let content = `${PDF_COLORS.separator} RG 0.35 w\n`

  for (let column = 1; column < columns; column += 1) {
    const x = PAGE_MARGIN + column * cellWidth + (column - 0.5) * GRID_GAP
    content += `${x.toFixed(2)} ${PAGE_MARGIN.toFixed(2)} m ${x.toFixed(2)} ${(PAGE_HEIGHT - PAGE_MARGIN).toFixed(2)} l S\n`
  }

  for (let row = 1; row < rows; row += 1) {
    const y = PAGE_MARGIN + row * cellHeight + (row - 0.5) * GRID_GAP
    content += `${PAGE_MARGIN.toFixed(2)} ${y.toFixed(2)} m ${(PAGE_WIDTH - PAGE_MARGIN).toFixed(2)} ${y.toFixed(2)} l S\n`
  }

  return content
}

function buildPages(groups) {
  const pages = []

  for (const group of groups) {
    const { columns, rows } = getGroupLayout(group.label)
    const itemsPerPage = columns * rows
    const cellWidth =
      (PAGE_WIDTH - PAGE_MARGIN * 2 - GRID_GAP * (columns - 1)) / columns
    const cellHeight =
      (PAGE_HEIGHT - PAGE_MARGIN * 2 - GRID_GAP * (rows - 1)) / rows

    for (let offset = 0; offset < group.items.length; offset += itemsPerPage) {
      const pageItems = group.items.slice(offset, offset + itemsPerPage)
      let content = `${PDF_COLORS.background} rg 0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f\n`
      content += drawGridSeparators(columns, rows, cellWidth, cellHeight)

      pageItems.forEach((item, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        const cellX = PAGE_MARGIN + column * (cellWidth + GRID_GAP)
        const cellTop =
          PAGE_HEIGHT - PAGE_MARGIN - row * (cellHeight + GRID_GAP)
        const cellBottom = cellTop - cellHeight
        const centerX = cellX + cellWidth / 2
        const scale = Math.min(cellWidth / 288.64, cellHeight / 411.95)
        const cardInset = (cellWidth * 18) / 1050
        const innerInset = (cellWidth * 18) / 1050
        const outerRadius = (cellWidth * 32) / 1050
        const innerRadius = (cellWidth * 24) / 1050
        const outerStrokeWidth = (cellWidth * 12) / 1050
        const innerStrokeWidth = (cellWidth * 4) / 1050
        const qrSize = Math.min(cellWidth * 0.724, cellHeight * 0.514)
        const qrX = centerX - qrSize / 2
        const qrY = cellTop - cellHeight * 0.223 - qrSize

        content += `${PDF_COLORS.background} rg ${PDF_COLORS.primary} RG ${outerStrokeWidth.toFixed(2)} w ${roundedRectanglePath(cellX + cardInset, cellBottom + cardInset, cellWidth - cardInset * 2, cellHeight - cardInset * 2, outerRadius)} B\n`
        content += `${PDF_COLORS.secondary} RG ${innerStrokeWidth.toFixed(2)} w ${roundedRectanglePath(cellX + cardInset + innerInset, cellBottom + cardInset + innerInset, cellWidth - (cardInset + innerInset) * 2, cellHeight - (cardInset + innerInset) * 2, innerRadius)} S\n`
        content += drawCenteredText(
          getSingularLabel(group.label),
          centerX,
          cellTop - cellHeight * 0.096,
          9 * scale,
          "F2",
          PDF_COLORS.primary
        )
        content += drawFittedCenteredText(
          item.name,
          centerX,
          cellTop - cellHeight * 0.159,
          cellWidth * 0.84,
          14 * scale,
          6,
          "F2",
          PDF_COLORS.text
        )
        content += drawQrCode(item.url, qrX, qrY, qrSize)
        content += drawCenteredText(
          "Escaneie com o app",
          centerX,
          cellBottom + cellHeight * 0.149,
          10 * scale,
          "F1",
          PDF_COLORS.mutedText
        )
        content += drawCenteredText(
          "DevFest Triangulo 2026",
          centerX,
          cellBottom + cellHeight * 0.108,
          7 * scale,
          "F1",
          PDF_COLORS.mutedText
        )
      })

      pages.push(content)
    }
  }

  return pages
}

const projectId = requireEnvironment("FIREBASE_PROJECT_ID")
const eventId = requireEnvironment("EVENT_ID")
const appUrl = new URL(requireEnvironment("NEXT_PUBLIC_APP_URL"))
const firebaseApp = initializeApp({
  credential: cert({
    projectId,
    clientEmail: requireEnvironment("FIREBASE_CLIENT_EMAIL"),
    privateKey: requireEnvironment("FIREBASE_PRIVATE_KEY").replace(
      /\\n/g,
      "\n"
    ),
  }),
})
const firestore = getFirestore(firebaseApp)

async function loadGroup({
  collection,
  label,
  routeType,
  titleField,
  filter = () => true,
}) {
  const snapshots = await firestore
    .collection(collection)
    .where("eventId", "==", eventId)
    .get()
  const items = snapshots.docs
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }))
    .filter((item) => item.active && item.qrId && filter(item))
    .sort((first, second) =>
      String(first[titleField]).localeCompare(
        String(second[titleField]),
        "pt-BR"
      )
    )
    .map((item) => ({
      id: item.id,
      name: String(item[titleField]),
      url: new URL(
        `/qr/${encodeURIComponent(eventId)}/${routeType}/${encodeURIComponent(item.qrId)}`,
        appUrl
      ).toString(),
    }))

  return { label, items }
}

const groups = await Promise.all([
  loadGroup({
    collection: "companies",
    label: "Empresas",
    routeType: "company",
    titleField: "name",
  }),
  loadGroup({
    collection: "tags",
    label: "Tags",
    routeType: "tag",
    titleField: "name",
  }),
  loadGroup({
    collection: "missions",
    label: "Missoes",
    routeType: "mission",
    titleField: "title",
    filter: (mission) => mission.validationType === "qr",
  }),
])

const pages = buildPages(groups)
const pdf = buildPdf(pages)

await mkdir(OUTPUT_DIRECTORY, { recursive: true })
await writeFile(OUTPUT_FILE, pdf)

console.log(
  JSON.stringify(
    {
      output: OUTPUT_FILE,
      pageCount: pages.length,
      appUrl: appUrl.origin,
      groups: groups.map((group) => ({
        label: group.label,
        count: group.items.length,
      })),
    },
    null,
    2
  )
)

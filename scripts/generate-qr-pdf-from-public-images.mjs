import { mkdir, readdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"

import sharp from "sharp"

const QR_DIRECTORY = path.resolve("public/images/qr")
const LINKS_FILE = path.join(QR_DIRECTORY, "qr-links.json")
const OUTPUT_DIRECTORY = path.resolve("artifacts")
const OUTPUT_FILE = path.join(OUTPUT_DIRECTORY, "pdf-de-qrs.pdf")

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const PAGE_MARGIN = 42.52
const GRID_GAP = 10

const PDF_COLORS = {
  background: "1 1 1 rg",
  separator: "0 0 0 RG",
}

function normalizeName(filename) {
  return filename
    .replace(/\.png$/i, "")
    .replace(/^(empresa|tag|missao)-/i, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

function getGroupLayout(filename) {
  return filename.toLowerCase().startsWith("empresa-")
    ? { columns: 2, rows: 2 }
    : { columns: 3, rows: 3 }
}

function drawGridSeparators(columns, rows, cellWidth, cellHeight) {
  let content = `${PDF_COLORS.separator} 1 w\n`

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
    const { columns, rows } = getGroupLayout(group.items[0]?.filename ?? "")
    const itemsPerPage = columns * rows
    const cellWidth =
      (PAGE_WIDTH - PAGE_MARGIN * 2 - GRID_GAP * (columns - 1)) / columns
    const cellHeight =
      (PAGE_HEIGHT - PAGE_MARGIN * 2 - GRID_GAP * (rows - 1)) / rows

    for (let offset = 0; offset < group.items.length; offset += itemsPerPage) {
      const pageItems = group.items.slice(offset, offset + itemsPerPage)
      let content = `${PDF_COLORS.background}\n0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT} re f\n`
      content += drawGridSeparators(columns, rows, cellWidth, cellHeight)

      pageItems.forEach((item, index) => {
        const column = index % columns
        const row = Math.floor(index / columns)
        const cellX = PAGE_MARGIN + column * (cellWidth + GRID_GAP)
        const cellTop =
          PAGE_HEIGHT - PAGE_MARGIN - row * (cellHeight + GRID_GAP)
        const cellBottom = cellTop - cellHeight
        const availableWidth = cellWidth - 16
        const availableHeight = cellHeight - 16
        const aspectRatio = item.width / item.height
        let drawWidth = availableWidth
        let drawHeight = drawWidth / aspectRatio

        if (drawHeight > availableHeight) {
          drawHeight = availableHeight
          drawWidth = drawHeight * aspectRatio
        }

        const imageX = cellX + (cellWidth - drawWidth) / 2
        const imageY = cellBottom + (cellHeight - drawHeight) / 2

        content += `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${imageX.toFixed(2)} ${imageY.toFixed(2)} cm /${item.imageName} Do\nQ\n`
      })

      pages.push(content)
    }
  }

  return pages
}

function buildPdf(pages, imageResources) {
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

  const imageIds = imageResources.map((resource) => addObject(resource.content))
  const pageIds = []

  const xobjectEntries = imageResources
    .map((resource, index) => `/${resource.name} ${imageIds[index]} 0 R`)
    .join(" ")

  for (const pageContent of pages) {
    const contentBuffer = Buffer.from(pageContent, "latin1")
    const contentId = addObject(
      Buffer.concat([
        Buffer.from(`<< /Length ${contentBuffer.length} >>\nstream\n`, "latin1"),
        contentBuffer,
        Buffer.from("\nendstream", "latin1"),
      ])
    )

    const resources = `<< /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> /XObject << ${xobjectEntries} >> >>`
    const pageId = addObject(
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources ${resources} /Contents ${contentId} 0 R >>`
    )
    pageIds.push(pageId)
  }

  objects[catalogId - 1] = Buffer.from(
    `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
    "latin1"
  )
  objects[pagesId - 1] = Buffer.from(
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] >>`,
    "latin1"
  )

  const chunks = [Buffer.from("%PDF-1.4\n%\xff\xff\xff\xff\n", "latin1")]
  const offsets = [0]
  let byteOffset = chunks[0].length

  objects.forEach((object, index) => {
    offsets.push(byteOffset)
    const chunk = Buffer.concat([
      Buffer.from(`${index + 1} 0 obj\n`, "latin1"),
      object,
      Buffer.from("\nendobj\n", "latin1"),
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
      `${xref}trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
      "latin1"
    )
  )

  return Buffer.concat(chunks)
}

function imageResourceName(index) {
  return `Im${index + 1}`
}

async function loadQrLinks() {
  try {
    const file = await readFile(LINKS_FILE, "utf8")
    const parsed = JSON.parse(file)

    if (!Array.isArray(parsed)) {
      throw new Error("qr-links.json must contain an array")
    }

    return new Map(parsed.map((item) => [String(item.filename), item]))
  } catch (error) {
    if (error?.code === "ENOENT") {
      return new Map()
    }

    throw error
  }
}

async function loadQrItems() {
  const files = await readdir(QR_DIRECTORY)
  const links = await loadQrLinks()

  const pngFiles = files
    .filter((file) => file.toLowerCase().endsWith(".png"))
    .sort((first, second) =>
      first.localeCompare(second, "pt-BR", { sensitivity: "base" })
    )

  const items = []

  for (const filename of pngFiles) {
    if (filename === "qr-links.json") {
      continue
    }

    const entry = links.get(filename)
    const url = entry?.url

    if (!url) {
      throw new Error(
        `Não foi possível encontrar a URL do QR Code para ${filename}. Atualize public/images/qr/qr-links.json ou gere novamente as imagens PNG.`
      )
    }

    items.push({
      filename,
      name: entry?.name ?? normalizeName(filename),
      url,
      imagePath: path.join(QR_DIRECTORY, filename),
    })
  }

  return items
}

async function buildImageResources(items) {
  const resources = []

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    const imageName = imageResourceName(index)
    const image = sharp(item.imagePath).flatten({ background: "#ffffff" })
    const metadata = await image.metadata()

    if (!metadata.width || !metadata.height) {
      throw new Error(`Unable to read image dimensions for ${item.imagePath}`)
    }

    const imageBuffer = await image.jpeg({ quality: 100 }).toBuffer()
    const metadataLength = imageBuffer.length
    const content = Buffer.concat([
      Buffer.from(
        `<< /Type /XObject /Subtype /Image /Width ${metadata.width} /Height ${metadata.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${metadataLength} >>\nstream\n`,
        "latin1"
      ),
      imageBuffer,
      Buffer.from("\nendstream", "latin1"),
    ])

    resources.push({
      name: imageName,
      content,
      width: metadata.width,
      height: metadata.height,
      filename: item.filename,
    })
    item.imageName = imageName
    item.width = metadata.width
    item.height = metadata.height
  }

  return resources
}

async function main() {
  const items = await loadQrItems()
  const companyItems = items.filter((item) => item.filename.toLowerCase().startsWith("empresa-"))
  const otherItems = items.filter((item) => !item.filename.toLowerCase().startsWith("empresa-"))

  const groups = []
  if (companyItems.length > 0) {
    groups.push({ label: "empresa", items: companyItems })
  }
  if (otherItems.length > 0) {
    groups.push({ label: "outros", items: otherItems })
  }

  const imageResources = await buildImageResources(items)
  const pages = buildPages(groups)
  const pdf = buildPdf(pages, imageResources)

  await mkdir(OUTPUT_DIRECTORY, { recursive: true })
  await writeFile(OUTPUT_FILE, pdf)

  console.log(
    JSON.stringify(
      {
        output: OUTPUT_FILE,
        pageCount: pages.length,
        totalItems: items.length,
        companies: companyItems.length,
        others: otherItems.length,
      },
      null,
      2
    )
  )
}

await main()

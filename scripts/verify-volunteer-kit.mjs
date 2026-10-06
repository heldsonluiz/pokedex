/** Verify generated PNGs with the QR decoder already used by the application. */
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"

import sharp from "sharp"

const require = createRequire(import.meta.url)
const readerRequire = createRequire(require.resolve("@zxing/browser"))
const {
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
  QRCodeReader,
  DecodeHintType,
} = readerRequire("@zxing/library")
const directory = path.resolve("artifacts/volunteer-tests")
const manifest = JSON.parse(
  await readFile(path.join(directory, "manifest.json"), "utf8")
)
if (manifest.items.length !== 38)
  throw new Error("Kit incompleto: esperados 38 códigos.")
const hints = new Map([[DecodeHintType.TRY_HARDER, true]])
let verified = 0
for (const item of manifest.items) {
  const filename = path.join(directory, "qr", item.filename)
  for (const focused of [false, true]) {
    const input = sharp(filename)
    if (focused && item.type !== "control")
      input.extract({ left: 140, top: 320, width: 770, height: 780 })
    const { data, info } = await input
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true })
    const source = new RGBLuminanceSource(
      new Uint8ClampedArray(data),
      info.width,
      info.height
    )
    try {
      const actual = new QRCodeReader()
        .decode(
          new BinaryBitmap(new HybridBinarizer(source)),
          focused ? undefined : hints
        )
        .getText()
      if (actual !== item.url) throw new Error("URL divergente")
    } catch (error) {
      throw new Error(
        `Falha de leitura em ${item.filename} (${focused ? "área do QR" : "página inteira"})`,
        { cause: error }
      )
    }
  }
  verified++
}
console.log(
  JSON.stringify({
    decodedPngs: verified,
    fullPageWithTryHarder: true,
    focusedWithDefaultDecoder: true,
    target: manifest.target,
  })
)

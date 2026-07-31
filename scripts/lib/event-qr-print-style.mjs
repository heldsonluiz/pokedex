/**
 * Identidade visual compartilhada pelos materiais impressos de QR Code.
 * Alterações de cor feitas aqui são refletidas tanto nos SVGs A6 quanto no PDF.
 */
export const EVENT_QR_PRINT_STYLE = {
  background: "#ffffff",
  primary: "#6d28d9",
  secondary: "#f6f118",
  text: "#111827",
  mutedText: "#4b5563",
  separator: "#d1d5db",
  qr: "#000000",
}

export function hexToPdfRgb(value) {
  const normalized = value.replace("#", "")
  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255
  )

  return channels.map((channel) => channel.toFixed(4)).join(" ")
}

declare module "qrcode" {
  type SvgOptions = {
    type: "svg"
    width?: number
    margin?: number
    errorCorrectionLevel?: "L" | "M" | "Q" | "H"
    color?: {
      dark?: string
      light?: string
    }
  }

  export function toString(text: string, options: SvgOptions): Promise<string>
}

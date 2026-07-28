import { ScanLine } from "lucide-react"
import type { Metadata } from "next"

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder"

export const metadata: Metadata = {
  title: "Scanner",
}

export default function ScanPage() {
  return (
    <FeaturePlaceholder
      icon={ScanLine}
      title="Scanner em breve"
      description="A câmera, a leitura e a validação dos QR Codes serão implementadas na fase de scanner."
    />
  )
}

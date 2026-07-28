import { Target } from "lucide-react"
import type { Metadata } from "next"

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder"

export const metadata: Metadata = {
  title: "Missões",
}

export default function MissionsPage() {
  return (
    <FeaturePlaceholder
      icon={Target}
      title="Missões em breve"
      description="O catálogo e o progresso das missões serão implementados em uma fase própria."
    />
  )
}

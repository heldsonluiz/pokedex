import { BookOpen } from "lucide-react"
import type { Metadata } from "next"

import { FeaturePlaceholder } from "@/components/layout/feature-placeholder"

export const metadata: Metadata = {
  title: "Passaporte",
}

export default function PassportPage() {
  return (
    <FeaturePlaceholder
      icon={BookOpen}
      title="Passaporte em breve"
      description="O progresso de visitas, missões e selos será implementado depois dessas funcionalidades."
    />
  )
}

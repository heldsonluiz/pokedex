import type { Metadata } from "next"

import { DesignSystemPreview } from "@/components/design-system/design-system-preview"

export const metadata: Metadata = {
  title: "Design System",
  robots: {
    index: false,
    follow: false,
  },
}

export default function DesignSystemPage() {
  return <DesignSystemPreview />
}

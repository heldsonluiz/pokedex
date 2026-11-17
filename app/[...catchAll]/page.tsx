import { notFound } from "next/navigation"

// Unknown URLs must not fall through to the authenticated modal catch-all.
export default function UnknownPage() {
  notFound()
}

import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { ActivityRevealCard } from "./activity-reveal-card"
import { QrResult } from "./qr-result"

vi.mock("next/link", () => ({
  default: ({
    href,
    replace,
    children,
  }: {
    href: string
    replace?: boolean
    children: ReactNode
  }) =>
    createElement(
      "a",
      { href, "data-replace": String(Boolean(replace)) },
      children
    ),
}))

describe("QR result celebrations", () => {
  it.each([
    ["success", true, true],
    ["success", false, false],
    ["error", true, false],
    ["loading", true, false],
  ] as const)(
    "shows confetti for status %s with celebrate=%s: %s",
    (status, celebrate, expected) => {
      const markup = renderToStaticMarkup(
        createElement(QrResult, {
          status,
          celebrate,
          title: "Resultado",
          description: "Atividade do evento",
        })
      )
      expect(markup.includes("<canvas")).toBe(expected)
      if (expected) expect(markup).toContain("pointer-events-none")
    }
  )
})

it.each(["/tags", "/missions", "/passport"])(
  "removes the scan result when continuing to %s or scanning again",
  (destination) => {
    const markup = renderToStaticMarkup(
      createElement(QrResult, {
        status: "success",
        title: "Resultado",
        description: "Registrado",
        actionHref: destination,
        actionLabel: "Ver progresso",
        secondaryActionHref: "/scan",
        secondaryActionLabel: "Ler outro QR",
      })
    )
    expect(markup).toContain(`href="${destination}" data-replace="true"`)
    expect(markup).toContain('href="/scan" data-replace="true"')
  }
)

describe("activity reveal cards", () => {
  it.each(["tag", "mission", "company"] as const)(
    "preserves reward and navigation behavior for %s",
    (kind) => {
      const props = {
        kind,
        title: "Atividade",
        description: "Descrição da atividade",
        xpAwarded: 75,
        href: "/tags",
        actionLabel: "Ver coleção",
      }
      const fresh = renderToStaticMarkup(
        createElement(ActivityRevealCard, { ...props, repeated: false })
      )
      const repeated = renderToStaticMarkup(
        createElement(ActivityRevealCard, { ...props, repeated: true })
      )
      expect(fresh).toContain("<canvas")
      expect(repeated).not.toContain("<canvas")
      expect(repeated).toContain("XP já recebido")
      expect(repeated).toContain("Nenhum XP adicional foi concedido")
      for (const markup of [fresh, repeated]) {
        expect(markup).toContain('href="/tags" data-replace="true"')
        expect(markup).toContain('href="/scan" data-replace="true"')
        expect(markup).toContain("Descrição da atividade")
      }
    }
  )
})

import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { CollectionCompletionCelebration } from "./collection-motion"

describe("collection celebration overlay", () => {
  it.each([
    { enabled: false, achievementKey: "companies", completedAt: Date.now() },
    { enabled: true, achievementKey: undefined, completedAt: undefined },
    { enabled: true, achievementKey: "companies", completedAt: 1 },
    { enabled: true, achievementKey: "companies", completedAt: Date.now() },
  ])("renders no overlay before eligibility is confirmed: %j", (props) => {
    expect(
      renderToStaticMarkup(
        createElement(CollectionCompletionCelebration, {
          ...props,
          label: "Empresas",
        })
      )
    ).toBe("")
  })
})

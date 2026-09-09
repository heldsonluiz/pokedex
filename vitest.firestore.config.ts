import { defineConfig, mergeConfig } from "vitest/config"

import baseConfig from "./vitest.config"

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: ["tests/integration/*.integration.ts"],
      testTimeout: 180_000,
      hookTimeout: 180_000,
      fileParallelism: false,
    },
  })
)

/* eslint-disable import/no-anonymous-default-export */
export default {
  extends: ["@commitlint/config-conventional"],

  rules: {
    "header-max-length": [2, "always", 100],
    "subject-empty": [2, "never"],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "refactor",
        "style",
        "docs",
        "test",
        "chore",
        "build",
        "ci",
        "perf",
        "revert",
      ],
    ],
  },
}

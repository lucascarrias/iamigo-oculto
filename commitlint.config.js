export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "build",
        "ci",
        "chore",
        "revert",
        "content",
      ],
    ],
    "scope-enum": [
      2,
      "always",
      ["engine", "providers", "players", "dossiers", "cli", "web", "docs", "ci", "deps"],
    ],
    "subject-case": [0],
  },
};

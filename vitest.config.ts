import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      { test: { name: "packages", root: "./packages" } },
      { test: { name: "apps", root: "./apps" } },
    ],
    passWithNoTests: true,
  },
});

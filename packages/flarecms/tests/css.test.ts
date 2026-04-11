import { expect, test, describe } from "bun:test";
import fs from "node:fs";
import { resolve } from "node:path";

describe("CSS Modularization", () => {
  const cssPath = resolve(__dirname, "../dist/style.css");

  test("CSS is built with flare-admin prefix", () => {
    const css = fs.readFileSync(cssPath, "utf8");
    // Verify prefix exists
    expect(css).toContain(".flare-admin");
  });

  test("Global tags are scoped under flare-admin", () => {
    const css = fs.readFileSync(cssPath, "utf8");

    // html/body are converted to .flare-admin
    expect(css).toContain(".flare-admin {");

    // Verify that utility classes are prefixed with the scope
    // Example: .flare-admin .bg-background
    expect(css).toContain(".flare-admin .bg-background");
  });
});
